import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

export const getByWeek = query({
  args: { weekId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("budgetGoals")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();
  },
});

// ============ MUTATIONS ============

export const upsert = mutation({
  args: {
    weekId: v.string(),
    target: v.number(),
    currency: v.optional(v.string()),
    dailyCalorieTarget: v.optional(v.number()),
    dailyProteinTarget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetGoals")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        target: args.target,
        currency: args.currency ?? "USD",
        dailyCalorieTarget: args.dailyCalorieTarget,
        dailyProteinTarget: args.dailyProteinTarget,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("budgetGoals", {
        weekId: args.weekId,
        target: args.target,
        currency: args.currency ?? "USD",
        dailyCalorieTarget: args.dailyCalorieTarget,
        dailyProteinTarget: args.dailyProteinTarget,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updateBudget = mutation({
  args: {
    weekId: v.string(),
    target: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetGoals")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        target: args.target,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("budgetGoals", {
        weekId: args.weekId,
        target: args.target,
        currency: "USD",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updateMacroGoals = mutation({
  args: {
    weekId: v.string(),
    dailyCalorieTarget: v.optional(v.number()),
    dailyProteinTarget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetGoals")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    const now = Date.now();

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.dailyCalorieTarget !== undefined) {
        updates.dailyCalorieTarget = args.dailyCalorieTarget;
      }
      if (args.dailyProteinTarget !== undefined) {
        updates.dailyProteinTarget = args.dailyProteinTarget;
      }
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("budgetGoals", {
        weekId: args.weekId,
        target: 0,
        currency: "USD",
        dailyCalorieTarget: args.dailyCalorieTarget,
        dailyProteinTarget: args.dailyProteinTarget,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
