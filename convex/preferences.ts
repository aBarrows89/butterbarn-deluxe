import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    // For now, get the single preferences document (no auth)
    const prefs = await ctx.db.query("preferences").first();
    return prefs ?? { dislikes: [], allergies: [], avoidMeals: [], substitutions: [], notes: "" };
  },
});

export const upsert = mutation({
  args: {
    dislikes: v.array(v.string()),
    allergies: v.array(v.string()),
    avoidMeals: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        dislikes: args.dislikes,
        allergies: args.allergies,
        avoidMeals: args.avoidMeals,
        notes: args.notes,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("preferences", {
      dislikes: args.dislikes,
      allergies: args.allergies,
      avoidMeals: args.avoidMeals,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addDislike = mutation({
  args: {
    item: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").first();
    const now = Date.now();
    const itemLower = args.item.toLowerCase().trim();

    if (existing) {
      const dislikes = existing.dislikes.includes(itemLower)
        ? existing.dislikes
        : [...existing.dislikes, itemLower];
      await ctx.db.patch(existing._id, { dislikes, updatedAt: now });
    } else {
      await ctx.db.insert("preferences", {
        dislikes: [itemLower],
        allergies: [],
        avoidMeals: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const addAvoidMeal = mutation({
  args: {
    mealName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").first();
    const now = Date.now();
    const mealLower = args.mealName.toLowerCase().trim();

    if (existing) {
      const avoidMeals = existing.avoidMeals.includes(mealLower)
        ? existing.avoidMeals
        : [...existing.avoidMeals, mealLower];
      await ctx.db.patch(existing._id, { avoidMeals, updatedAt: now });
    } else {
      await ctx.db.insert("preferences", {
        dislikes: [],
        allergies: [],
        avoidMeals: [mealLower],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const removeDislike = mutation({
  args: {
    item: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").first();
    if (!existing) return;

    const itemLower = args.item.toLowerCase().trim();
    const dislikes = existing.dislikes.filter((d) => d !== itemLower);
    await ctx.db.patch(existing._id, { dislikes, updatedAt: Date.now() });
  },
});

export const addAllergy = mutation({
  args: {
    item: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").first();
    const now = Date.now();
    const itemLower = args.item.toLowerCase().trim();

    if (existing) {
      const allergies = existing.allergies.includes(itemLower)
        ? existing.allergies
        : [...existing.allergies, itemLower];
      await ctx.db.patch(existing._id, { allergies, updatedAt: now });
    } else {
      await ctx.db.insert("preferences", {
        dislikes: [],
        allergies: [itemLower],
        avoidMeals: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const removeAllergy = mutation({
  args: {
    item: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").first();
    if (!existing) return;

    const itemLower = args.item.toLowerCase().trim();
    const allergies = existing.allergies.filter((a) => a !== itemLower);
    await ctx.db.patch(existing._id, { allergies, updatedAt: Date.now() });
  },
});

export const removeSubstitution = mutation({
  args: {
    original: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").first();
    if (!existing || !existing.substitutions) return;

    const originalLower = args.original.toLowerCase().trim();
    const substitutions = existing.substitutions.filter((s) => s.original !== originalLower);
    await ctx.db.patch(existing._id, { substitutions, updatedAt: Date.now() });
  },
});

export const addSubstitution = mutation({
  args: {
    original: v.string(),
    replacement: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("preferences").first();
    const now = Date.now();
    const sub = {
      original: args.original.toLowerCase().trim(),
      replacement: args.replacement.toLowerCase().trim(),
    };

    if (existing) {
      const subs = existing.substitutions ?? [];
      // Check if substitution already exists
      const exists = subs.some((s) => s.original === sub.original);
      const substitutions = exists
        ? subs.map((s) => (s.original === sub.original ? sub : s))
        : [...subs, sub];
      await ctx.db.patch(existing._id, { substitutions, updatedAt: now });
    } else {
      await ctx.db.insert("preferences", {
        dislikes: [],
        allergies: [],
        avoidMeals: [],
        substitutions: [sub],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
