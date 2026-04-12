import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

export const getByMeal = query({
  args: { mealKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_meal", (q) => q.eq("mealKey", args.mealKey))
      .first();
  },
});

export const getAllForWeek = query({
  args: { weekId: v.string() },
  handler: async (ctx, args) => {
    const allRatings = await ctx.db.query("ratings").collect();
    // Filter ratings that start with this weekId
    return allRatings.filter((r) => r.mealKey.startsWith(args.weekId));
  },
});

// ============ MUTATIONS ============

export const upsert = mutation({
  args: {
    mealKey: v.string(), // Format: "weekId-Day-MealType"
    mealName: v.string(),
    prep: v.number(),
    taste: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_meal", (q) => q.eq("mealKey", args.mealKey))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        mealName: args.mealName,
        prep: args.prep,
        taste: args.taste,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("ratings", {
        mealKey: args.mealKey,
        mealName: args.mealName,
        prep: args.prep,
        taste: args.taste,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updatePrepRating = mutation({
  args: {
    mealKey: v.string(),
    mealName: v.string(),
    prep: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_meal", (q) => q.eq("mealKey", args.mealKey))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        prep: args.prep,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("ratings", {
        mealKey: args.mealKey,
        mealName: args.mealName,
        prep: args.prep,
        taste: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updateTasteRating = mutation({
  args: {
    mealKey: v.string(),
    mealName: v.string(),
    taste: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_meal", (q) => q.eq("mealKey", args.mealKey))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        taste: args.taste,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("ratings", {
        mealKey: args.mealKey,
        mealName: args.mealName,
        prep: 0,
        taste: args.taste,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
