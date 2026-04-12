import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByMealName = query({
  args: { mealName: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.mealName.toLowerCase().trim();
    return await ctx.db
      .query("recipes")
      .withIndex("by_meal", (q) => q.eq("mealName", normalized))
      .first();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("recipes")
      .order("desc")
      .collect();
  },
});

export const getTopRated = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const recipes = await ctx.db
      .query("recipes")
      .collect();

    // Sort by taste rating, then by times used
    return recipes
      .filter((r) => r.tasteRating && r.tasteRating >= 4)
      .sort((a, b) => {
        const ratingDiff = (b.tasteRating || 0) - (a.tasteRating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return b.timesUsed - a.timesUsed;
      })
      .slice(0, args.limit || 10);
  },
});

export const save = mutation({
  args: {
    mealName: v.string(),
    displayName: v.string(),
    prepTime: v.string(),
    cookTime: v.string(),
    servings: v.number(),
    ingredients: v.array(v.object({
      item: v.string(),
      amount: v.string(),
    })),
    steps: v.array(v.string()),
    tips: v.optional(v.string()),
    butterQuip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalized = args.mealName.toLowerCase().trim();
    const now = Date.now();

    // Check if recipe already exists
    const existing = await ctx.db
      .query("recipes")
      .withIndex("by_meal", (q) => q.eq("mealName", normalized))
      .first();

    if (existing) {
      // Update existing recipe
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        prepTime: args.prepTime,
        cookTime: args.cookTime,
        servings: args.servings,
        ingredients: args.ingredients,
        steps: args.steps,
        tips: args.tips,
        butterQuip: args.butterQuip,
        timesUsed: existing.timesUsed + 1,
        lastUsed: now,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new recipe
    return await ctx.db.insert("recipes", {
      mealName: normalized,
      displayName: args.displayName,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      ingredients: args.ingredients,
      steps: args.steps,
      tips: args.tips,
      butterQuip: args.butterQuip,
      timesUsed: 1,
      lastUsed: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateRating = mutation({
  args: {
    mealName: v.string(),
    prepRating: v.optional(v.number()),
    tasteRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalized = args.mealName.toLowerCase().trim();
    const existing = await ctx.db
      .query("recipes")
      .withIndex("by_meal", (q) => q.eq("mealName", normalized))
      .first();

    if (!existing) return null;

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.prepRating !== undefined) {
      updates.prepRating = args.prepRating;
    }
    if (args.tasteRating !== undefined) {
      updates.tasteRating = args.tasteRating;
    }

    await ctx.db.patch(existing._id, updates);
    return existing._id;
  },
});

export const incrementUsage = mutation({
  args: { mealName: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.mealName.toLowerCase().trim();
    const existing = await ctx.db
      .query("recipes")
      .withIndex("by_meal", (q) => q.eq("mealName", normalized))
      .first();

    if (!existing) return null;

    await ctx.db.patch(existing._id, {
      timesUsed: existing.timesUsed + 1,
      lastUsed: Date.now(),
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

export const remove = mutation({
  args: { mealName: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.mealName.toLowerCase().trim();
    const existing = await ctx.db
      .query("recipes")
      .withIndex("by_meal", (q) => q.eq("mealName", normalized))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});
