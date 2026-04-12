import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("favorites")
      .withIndex("by_use_count")
      .order("desc")
      .collect();
  },
});

export const getByName = query({
  args: { mealName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("favorites")
      .withIndex("by_name", (q) => q.eq("mealName", args.mealName))
      .first();
  },
});

// ============ MUTATIONS ============

export const add = mutation({
  args: {
    mealName: v.string(),
    prepTag: v.optional(v.string()),
    recipeNote: v.optional(v.string()),
    nutrition: v.optional(
      v.object({
        calories: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_name", (q) => q.eq("mealName", args.mealName))
      .first();

    if (existing) {
      // Already a favorite, increment use count
      await ctx.db.patch(existing._id, {
        useCount: existing.useCount + 1,
        lastUsed: Date.now(),
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("favorites", {
      mealName: args.mealName,
      prepTag: args.prepTag,
      recipeNote: args.recipeNote,
      nutrition: args.nutrition,
      useCount: 1,
      lastUsed: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { mealName: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_name", (q) => q.eq("mealName", args.mealName))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const updatePrepTag = mutation({
  args: {
    mealName: v.string(),
    prepTag: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_name", (q) => q.eq("mealName", args.mealName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        prepTag: args.prepTag,
        updatedAt: Date.now(),
      });
    }
  },
});

export const updateRecipeNote = mutation({
  args: {
    mealName: v.string(),
    recipeNote: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_name", (q) => q.eq("mealName", args.mealName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        recipeNote: args.recipeNote,
        updatedAt: Date.now(),
      });
    }
  },
});

export const incrementUseCount = mutation({
  args: { mealName: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_name", (q) => q.eq("mealName", args.mealName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        useCount: existing.useCount + 1,
        lastUsed: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
