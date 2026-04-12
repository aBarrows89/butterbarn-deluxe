import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("priceHistory").collect();
  },
});

export const getByIngredient = query({
  args: { ingredientKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("priceHistory")
      .withIndex("by_ingredient", (q) => q.eq("ingredientKey", args.ingredientKey))
      .first();
  },
});

// ============ MUTATIONS ============

export const addEntry = mutation({
  args: {
    ingredientKey: v.string(),
    displayName: v.string(),
    entry: v.object({
      date: v.string(),
      price: v.number(),
      store: v.string(),
      quantity: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("priceHistory")
      .withIndex("by_ingredient", (q) => q.eq("ingredientKey", args.ingredientKey))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        entries: [...existing.entries, args.entry],
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("priceHistory", {
        ingredientKey: args.ingredientKey,
        displayName: args.displayName,
        entries: [args.entry],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const addMultipleEntries = mutation({
  args: {
    items: v.array(
      v.object({
        ingredientKey: v.string(),
        displayName: v.string(),
        entry: v.object({
          date: v.string(),
          price: v.number(),
          store: v.string(),
          quantity: v.optional(v.string()),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const item of args.items) {
      const existing = await ctx.db
        .query("priceHistory")
        .withIndex("by_ingredient", (q) => q.eq("ingredientKey", item.ingredientKey))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          entries: [...existing.entries, item.entry],
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("priceHistory", {
          ingredientKey: item.ingredientKey,
          displayName: item.displayName,
          entries: [item.entry],
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});
