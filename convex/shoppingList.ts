import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const itemValidator = v.object({
  id: v.string(),
  ingredient: v.string(),
  quantity: v.string(),
  unit: v.string(),
  meal: v.string(),
  mealKey: v.optional(v.string()),
  category: v.string(),
  checked: v.boolean(),
  estimatedCost: v.optional(v.number()),
  haveIt: v.optional(v.boolean()),
});

// ============ QUERIES ============

export const getByWeek = query({
  args: { weekId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();
  },
});

// ============ MUTATIONS ============

export const upsert = mutation({
  args: {
    weekId: v.string(),
    items: v.array(itemValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        items: args.items,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("shoppingList", {
        weekId: args.weekId,
        items: args.items,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const toggleItem = mutation({
  args: {
    weekId: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!list) {
      throw new Error("Shopping list not found");
    }

    const updatedItems = list.items.map((item) =>
      item.id === args.itemId ? { ...item, checked: !item.checked } : item
    );

    await ctx.db.patch(list._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });
  },
});

export const markHaveIt = mutation({
  args: {
    weekId: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!list) {
      throw new Error("Shopping list not found");
    }

    const updatedItems = list.items.map((item) =>
      item.id === args.itemId ? { ...item, haveIt: true, checked: true } : item
    );

    await ctx.db.patch(list._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });
  },
});

export const addItem = mutation({
  args: {
    weekId: v.string(),
    item: itemValidator,
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    const now = Date.now();

    if (list) {
      await ctx.db.patch(list._id, {
        items: [...list.items, args.item],
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("shoppingList", {
        weekId: args.weekId,
        items: [args.item],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const removeItem = mutation({
  args: {
    weekId: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!list) {
      throw new Error("Shopping list not found");
    }

    const updatedItems = list.items.filter((item) => item.id !== args.itemId);

    await ctx.db.patch(list._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });
  },
});

export const clearChecked = mutation({
  args: { weekId: v.string() },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!list) return;

    const updatedItems = list.items.filter((item) => !item.checked);

    await ctx.db.patch(list._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });
  },
});

export const uncheckAll = mutation({
  args: { weekId: v.string() },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!list) return;

    const updatedItems = list.items.map((item) => ({ ...item, checked: false }));

    await ctx.db.patch(list._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });
  },
});

export const removeItemsByMeal = mutation({
  args: {
    weekId: v.string(),
    mealPattern: v.string(), // e.g., "Monday Dinner"
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!list) return;

    // Remove items that match the meal pattern (e.g., "Monday Dinner — Chicken Tacos")
    const updatedItems = list.items.filter(
      (item) => !item.meal.startsWith(args.mealPattern)
    );

    await ctx.db.patch(list._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });
  },
});

// Preferred swap-removal path: matches on the structured mealKey field
// (e.g. "Monday-Dinner"). Falls back to the legacy meal-string prefix for
// items written before mealKey was added, so existing data still works.
export const removeItemsByMealKey = mutation({
  args: {
    weekId: v.string(),
    mealKey: v.string(), // e.g., "Monday-Dinner"
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!list) return;

    const legacyPrefix = args.mealKey.replace("-", " ");
    const updatedItems = list.items.filter((item) => {
      if (item.mealKey) return item.mealKey !== args.mealKey;
      return !item.meal.startsWith(legacyPrefix);
    });

    await ctx.db.patch(list._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });
  },
});

export const addItems = mutation({
  args: {
    weekId: v.string(),
    items: v.array(itemValidator),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("shoppingList")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    const now = Date.now();

    if (list) {
      await ctx.db.patch(list._id, {
        items: [...list.items, ...args.items],
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("shoppingList", {
        weekId: args.weekId,
        items: args.items,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
