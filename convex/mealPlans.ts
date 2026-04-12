import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

export const getByWeek = query({
  args: { weekId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mealPlans")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    // Get current ISO week
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const weekId = `${year}-W${String(weekNumber).padStart(2, "0")}`;

    return await ctx.db
      .query("mealPlans")
      .withIndex("by_week", (q) => q.eq("weekId", weekId))
      .first();
  },
});

// ============ MUTATIONS ============

export const upsert = mutation({
  args: {
    weekId: v.string(),
    meals: v.object({
      Monday: v.object({
        Breakfast: v.string(),
        Lunch: v.string(),
        Dinner: v.string(),
        Snacks: v.string(),
      }),
      Tuesday: v.object({
        Breakfast: v.string(),
        Lunch: v.string(),
        Dinner: v.string(),
        Snacks: v.string(),
      }),
      Wednesday: v.object({
        Breakfast: v.string(),
        Lunch: v.string(),
        Dinner: v.string(),
        Snacks: v.string(),
      }),
      Thursday: v.object({
        Breakfast: v.string(),
        Lunch: v.string(),
        Dinner: v.string(),
        Snacks: v.string(),
      }),
      Friday: v.object({
        Breakfast: v.string(),
        Lunch: v.string(),
        Dinner: v.string(),
        Snacks: v.string(),
      }),
      Saturday: v.object({
        Breakfast: v.string(),
        Lunch: v.string(),
        Dinner: v.string(),
        Snacks: v.string(),
      }),
      Sunday: v.object({
        Breakfast: v.string(),
        Lunch: v.string(),
        Dinner: v.string(),
        Snacks: v.string(),
      }),
    }),
    nutrition: v.record(
      v.string(),
      v.object({
        calories: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
      })
    ),
    guests: v.number(),
    grandmaMode: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        meals: args.meals,
        nutrition: args.nutrition,
        guests: args.guests,
        grandmaMode: args.grandmaMode,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("mealPlans", {
        weekId: args.weekId,
        meals: args.meals,
        nutrition: args.nutrition,
        guests: args.guests,
        grandmaMode: args.grandmaMode,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updateMeal = mutation({
  args: {
    weekId: v.string(),
    day: v.string(),
    mealType: v.string(),
    mealName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!existing) {
      throw new Error("Meal plan not found");
    }

    const updatedMeals = { ...existing.meals };
    const day = args.day as keyof typeof updatedMeals;
    updatedMeals[day] = {
      ...updatedMeals[day],
      [args.mealType]: args.mealName,
    };

    await ctx.db.patch(existing._id, {
      meals: updatedMeals,
      updatedAt: Date.now(),
    });
  },
});

export const updateNutrition = mutation({
  args: {
    weekId: v.string(),
    nutritionKey: v.string(), // e.g., "Monday-Dinner"
    nutrition: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!existing) {
      throw new Error("Meal plan not found");
    }

    const updatedNutrition = {
      ...existing.nutrition,
      [args.nutritionKey]: args.nutrition,
    };

    await ctx.db.patch(existing._id, {
      nutrition: updatedNutrition,
      updatedAt: Date.now(),
    });
  },
});

export const updateSettings = mutation({
  args: {
    weekId: v.string(),
    guests: v.optional(v.number()),
    grandmaMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .first();

    if (!existing) {
      throw new Error("Meal plan not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.guests !== undefined) updates.guests = args.guests;
    if (args.grandmaMode !== undefined) updates.grandmaMode = args.grandmaMode;

    await ctx.db.patch(existing._id, updates);
  },
});
