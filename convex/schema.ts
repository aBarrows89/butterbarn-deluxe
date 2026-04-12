import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ USERS ============
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // ============ MEAL PLANS ============
  // Each week's meal plan (7 days × 4 meal types)
  mealPlans: defineTable({
    weekId: v.string(), // Format: "2024-W15" (ISO week)
    userId: v.optional(v.id("users")),
    // Meals stored as nested object: {Monday: {Breakfast: "", Lunch: "", Dinner: "", Snacks: ""}, ...}
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
    // Nutrition per meal: {"Monday-Dinner": {calories, protein, carbs, fat}}
    nutrition: v.record(
      v.string(),
      v.object({
        calories: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
      })
    ),
    // Settings for this week
    guests: v.number(),
    grandmaMode: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_week", ["weekId"])
    .index("by_user_week", ["userId", "weekId"]),

  // ============ SHOPPING LIST ============
  shoppingList: defineTable({
    weekId: v.string(),
    userId: v.optional(v.id("users")),
    items: v.array(
      v.object({
        id: v.string(),
        ingredient: v.string(),
        quantity: v.string(),
        unit: v.string(),
        meal: v.string(), // e.g., "Monday Dinner — Grilled Chicken"
        category: v.string(), // Produce, Meat & Seafood, Dairy & Eggs, Pantry, Frozen, Bakery, Beverages, Household, Other
        checked: v.boolean(),
        estimatedCost: v.optional(v.number()),
        haveIt: v.optional(v.boolean()), // "Have it" - user already has this item
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_week", ["weekId"])
    .index("by_user_week", ["userId", "weekId"]),

  // ============ PRICE HISTORY ============
  // Track prices per ingredient across stores
  priceHistory: defineTable({
    ingredientKey: v.string(), // lowercase normalized ingredient name
    displayName: v.string(), // original display name
    entries: v.array(
      v.object({
        date: v.string(), // YYYY-MM-DD
        price: v.number(),
        store: v.string(),
        quantity: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ingredient", ["ingredientKey"]),

  // ============ MEAL RATINGS ============
  ratings: defineTable({
    mealKey: v.string(), // Format: "weekId-Day-MealType" e.g., "2024-W15-Monday-Dinner"
    mealName: v.string(),
    prep: v.number(), // 1-5 stars
    taste: v.number(), // 1-5 stars
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_meal", ["mealKey"])
    .index("by_user_meal", ["userId", "mealKey"]),

  // ============ FAVORITE MEALS ============
  favorites: defineTable({
    mealName: v.string(),
    prepTag: v.optional(v.string()), // Quick, Slow Cooker, Grill, Oven, No-Cook
    recipeNote: v.optional(v.string()), // URL or text note
    useCount: v.number(), // How many times this meal has been used
    lastUsed: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    // Nutrition info (optional, from last use)
    nutrition: v.optional(
      v.object({
        calories: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
      })
    ),
    // Average ratings from all times this meal was made
    avgPrepRating: v.optional(v.number()),
    avgTasteRating: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["mealName"])
    .index("by_user", ["userId"])
    .index("by_use_count", ["useCount"]),

  // ============ HOUSEHOLD ITEMS ============
  // Recurring household items (separate from food shopping)
  householdItems: defineTable({
    name: v.string(),
    category: v.string(), // Cleaning, Paper Goods, Personal Care, Pet, Other
    lastBought: v.optional(v.number()),
    typicalStore: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_user", ["userId"]),

  // ============ BUDGET GOALS ============
  budgetGoals: defineTable({
    weekId: v.string(),
    userId: v.optional(v.id("users")),
    target: v.number(), // Dollar amount
    currency: v.string(), // "USD"
    // Macro goals (daily targets)
    dailyCalorieTarget: v.optional(v.number()),
    dailyProteinTarget: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_week", ["weekId"])
    .index("by_user_week", ["userId", "weekId"]),

  // ============ PREFERENCES ============
  // User food preferences, dislikes, allergies
  preferences: defineTable({
    userId: v.optional(v.id("users")),
    dislikes: v.array(v.string()), // Foods/ingredients they don't like
    allergies: v.array(v.string()), // Allergies to avoid
    avoidMeals: v.array(v.string()), // Specific meals that got poor ratings
    notes: v.optional(v.string()), // Other dietary notes
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ============ RECEIPTS ============
  // Store scanned receipt data
  receipts: defineTable({
    store: v.string(),
    date: v.string(), // YYYY-MM-DD
    total: v.number(),
    items: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        quantity: v.optional(v.string()),
        unit: v.optional(v.string()),
      })
    ),
    imageStorageId: v.optional(v.id("_storage")), // Original receipt image
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_store", ["store"])
    .index("by_date", ["date"])
    .index("by_user", ["userId"]),
});
