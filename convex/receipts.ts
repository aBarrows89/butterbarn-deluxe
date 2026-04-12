import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("receipts")
      .withIndex("by_date")
      .order("desc")
      .collect();
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("receipts")
      .withIndex("by_date")
      .order("desc")
      .take(limit);
  },
});

export const getByStore = query({
  args: { store: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("receipts")
      .withIndex("by_store", (q) => q.eq("store", args.store))
      .collect();
  },
});

// ============ MUTATIONS ============

export const add = mutation({
  args: {
    store: v.string(),
    date: v.string(),
    total: v.number(),
    items: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        quantity: v.optional(v.string()),
        unit: v.optional(v.string()),
      })
    ),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Check for existing receipt with same store and date (for multi-page receipts)
    const existing = await ctx.db
      .query("receipts")
      .withIndex("by_store", (q) => q.eq("store", args.store))
      .collect();

    const sameDay = existing.find((r) => r.date === args.date);

    if (sameDay) {
      // Merge items, avoiding duplicates by name+price
      const existingKeys = new Set(
        sameDay.items.map((i) => `${i.name.toLowerCase()}|${i.price}`)
      );
      const newItems = args.items.filter(
        (i) => !existingKeys.has(`${i.name.toLowerCase()}|${i.price}`)
      );

      if (newItems.length > 0) {
        await ctx.db.patch(sameDay._id, {
          items: [...sameDay.items, ...newItems],
          total: Math.max(sameDay.total, args.total), // Use larger total
        });
      }
      return sameDay._id;
    }

    return await ctx.db.insert("receipts", {
      store: args.store,
      date: args.date,
      total: args.total,
      items: args.items,
      imageStorageId: args.imageStorageId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("receipts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
