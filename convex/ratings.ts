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

// Get all ratings for AI feedback loop - summarizes what meals are liked/disliked
export const getRatingSummary = query({
  args: {},
  handler: async (ctx) => {
    const allRatings = await ctx.db.query("ratings").collect();

    // Group ratings by meal name and calculate averages
    const mealStats: Record<string, { totalPrep: number; totalTaste: number; count: number }> = {};

    for (const r of allRatings) {
      const name = r.mealName.toLowerCase().trim();
      if (!mealStats[name]) {
        mealStats[name] = { totalPrep: 0, totalTaste: 0, count: 0 };
      }
      mealStats[name].totalPrep += r.prep;
      mealStats[name].totalTaste += r.taste;
      mealStats[name].count++;
    }

    const favorites: string[] = [];
    const disliked: string[] = [];
    const easyMeals: string[] = [];
    const hardMeals: string[] = [];

    for (const [name, stats] of Object.entries(mealStats)) {
      const avgTaste = stats.totalTaste / stats.count;
      const avgPrep = stats.totalPrep / stats.count;

      // Taste ratings: 4-5 = favorites, 1-2 = disliked
      if (avgTaste >= 4) favorites.push(name);
      else if (avgTaste <= 2 && stats.count >= 1) disliked.push(name);

      // Prep ratings: 4-5 = easy, 1-2 = hard
      if (avgPrep >= 4) easyMeals.push(name);
      else if (avgPrep <= 2) hardMeals.push(name);
    }

    return { favorites, disliked, easyMeals, hardMeals };
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
