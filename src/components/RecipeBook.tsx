"use client";

import { useState } from "react";
import { T } from "@/lib/constants";

interface Recipe {
  _id: string;
  mealName: string;
  displayName: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: Array<{ item: string; amount: string }>;
  steps: string[];
  tips?: string;
  butterQuip?: string;
  prepRating?: number;
  tasteRating?: number;
  timesUsed: number;
  lastUsed?: number;
  createdAt: number;
}

interface RecipeBookProps {
  recipes: Recipe[];
  onDelete?: (mealName: string) => void;
}

// Auto-categorize recipes based on keywords in meal name
const CATEGORIES = [
  { name: "Chicken", keywords: ["chicken", "poultry", "wings", "drumstick"] },
  { name: "Beef", keywords: ["beef", "steak", "burger", "meatball", "meatloaf", "roast"] },
  { name: "Pork", keywords: ["pork", "bacon", "ham", "sausage", "chop"] },
  { name: "Seafood", keywords: ["fish", "salmon", "shrimp", "tuna", "cod", "tilapia", "crab", "lobster", "seafood"] },
  { name: "Pasta", keywords: ["pasta", "spaghetti", "lasagna", "noodle", "mac", "fettuccine", "penne", "rigatoni"] },
  { name: "Soup & Stew", keywords: ["soup", "stew", "chili", "chowder", "bisque"] },
  { name: "Mexican", keywords: ["taco", "burrito", "enchilada", "quesadilla", "fajita", "mexican", "salsa"] },
  { name: "Asian", keywords: ["stir fry", "teriyaki", "asian", "chinese", "thai", "curry", "fried rice", "lo mein"] },
] as const;

function categorizeRecipe(recipe: Recipe): string {
  const name = recipe.displayName.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => name.includes(kw))) {
      return cat.name;
    }
  }
  return "Other";
}

function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ fontSize: size, color: n <= value ? T.butter : T.border }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function RecipeBook({ recipes, onDelete }: RecipeBookProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "favorites" | "recent">("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter and sort recipes
  let displayRecipes = [...recipes];
  if (filter === "favorites") {
    displayRecipes = displayRecipes.filter((r) => (r.tasteRating ?? 0) >= 4);
  } else if (filter === "recent") {
    displayRecipes = displayRecipes.sort((a, b) => (b.lastUsed ?? 0) - (a.lastUsed ?? 0));
  }

  // Default sort by times used (most popular first)
  if (filter === "all") {
    displayRecipes.sort((a, b) => b.timesUsed - a.timesUsed);
  }

  // Group recipes by category
  const recipesByCategory = displayRecipes.reduce((acc, recipe) => {
    const category = categorizeRecipe(recipe);
    if (!acc[category]) acc[category] = [];
    acc[category].push(recipe);
    return acc;
  }, {} as Record<string, Recipe[]>);

  // Sort categories: named categories first (alphabetically), "Other" last
  const sortedCategories = Object.keys(recipesByCategory).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDelete = (mealName: string) => {
    if (onDelete) {
      onDelete(mealName);
      setDeleteConfirm(null);
      setExpandedId(null);
    }
  };

  const formatDate = (ts?: number) => {
    if (!ts) return "Never";
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ padding: "16px 24px" }}>
      <div className="mb-1 shrink-0 font-bold" style={{ fontFamily: "var(--font-lora), serif", fontSize: "clamp(14px, 4vw, 18px)" }}>
        Recipe Book
      </div>
      <div className="mb-2 shrink-0" style={{ color: T.muted, fontSize: "clamp(10px, 2.5vw, 13px)" }}>
        {recipes.length} recipes saved
      </div>

      {/* Filter tabs */}
      <div className="mb-2 flex shrink-0 gap-1.5">
        {(["all", "favorites", "recent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="cursor-pointer rounded-full border font-bold capitalize"
            style={{
              background: filter === f ? T.terra : T.card,
              color: filter === f ? "#fff" : T.muted,
              borderColor: filter === f ? T.terra : T.border,
              padding: "4px 12px",
              fontSize: "clamp(9px, 2.2vw, 11px)",
            }}
          >
            {f === "favorites" ? "★ Favorites" : f === "recent" ? "Recent" : "All"}
          </button>
        ))}
      </div>

      {/* Recipes list */}
      <div className="min-h-0 flex-1 overflow-y-auto" style={{ paddingBottom: 100 }}>
        {displayRecipes.length === 0 ? (
          <div className="px-5 py-12 text-center" style={{ color: T.muted }}>
            <div className="mb-3 text-5xl">📖</div>
            <div className="mb-1.5 text-base" style={{ fontFamily: "var(--font-lora), serif", color: T.brown }}>
              {filter === "favorites" ? "No favorites yet" : "No recipes yet"}
            </div>
            <div className="text-[12.5px] leading-loose">
              {filter === "favorites"
                ? "Rate meals 4+ stars to add them here"
                : "Tap a meal and \"Get Recipe\" to save it"}
            </div>
          </div>
        ) : (
          sortedCategories.map((category) => {
            const categoryRecipes = recipesByCategory[category];
            const isCollapsed = collapsedCategories.has(category);

            return (
              <div key={category} className="mb-4">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="mb-2 flex w-full cursor-pointer items-center justify-between rounded-xl border-none"
                  style={{ background: T.greenL, padding: "10px 14px" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: T.green }}>
                      {category}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: T.green, color: "#fff" }}
                    >
                      {categoryRecipes.length}
                    </span>
                  </div>
                  <span style={{ color: T.green, fontSize: 14 }}>
                    {isCollapsed ? "▶" : "▼"}
                  </span>
                </button>

                {/* Category recipes */}
                {!isCollapsed && categoryRecipes.map((recipe) => {
                  const isExpanded = expandedId === recipe._id;
                  const isDeleting = deleteConfirm === recipe._id;

                  return (
                    <div
                      key={recipe._id}
                      className="mb-2 overflow-hidden rounded-2xl"
                      style={{ background: T.card, border: `1.5px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                    >
                      {/* Recipe header - always visible */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : recipe._id)}
                        className="cursor-pointer"
                        style={{ padding: "14px 16px" }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold capitalize" style={{ color: T.brown, fontSize: "clamp(12px, 3vw, 14px)" }}>
                              {recipe.displayName}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2" style={{ fontSize: "clamp(9px, 2.2vw, 11px)" }}>
                              <span style={{ color: T.muted }}>
                                ⏱ {recipe.prepTime} + {recipe.cookTime}
                              </span>
                              <span style={{ color: T.muted }}>
                                👥 {recipe.servings}
                              </span>
                              {recipe.timesUsed > 1 && (
                                <span style={{ color: T.green }}>
                                  Made {recipe.timesUsed}x
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            {recipe.tasteRating ? (
                              <Stars value={recipe.tasteRating} />
                            ) : (
                              <span style={{ color: T.muted, fontSize: "clamp(9px, 2vw, 11px)" }}>
                                Not rated
                              </span>
                            )}
                            <div style={{ color: T.muted, fontSize: "clamp(8px, 2vw, 10px)" }}>
                              {formatDate(recipe.lastUsed)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded recipe details */}
                      {isExpanded && (
                        <div className="border-t" style={{ borderTopColor: T.border, background: T.terraL, padding: "14px 16px" }}>
                          {/* Ingredients */}
                          <div className="mb-3">
                            <div className="mb-1.5 text-[10px] font-bold uppercase" style={{ color: T.terra }}>
                              Ingredients
                            </div>
                            <div className="rounded-lg p-2" style={{ background: T.card }}>
                              {recipe.ingredients.map((ing, i) => (
                                <div key={i} className="flex justify-between py-0.5 text-xs" style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                                  <span style={{ color: T.brown }}>{ing.item}</span>
                                  <span className="font-bold" style={{ color: T.muted }}>{ing.amount}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Steps */}
                          <div className="mb-3">
                            <div className="mb-1.5 text-[10px] font-bold uppercase" style={{ color: T.terra }}>
                              Instructions
                            </div>
                            <ol className="m-0 list-none p-0">
                              {recipe.steps.map((step, i) => (
                                <li key={i} className="mb-2 flex gap-2 text-xs leading-relaxed" style={{ color: T.brown }}>
                                  <span
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                                    style={{ background: T.terra, color: "#fff" }}
                                  >
                                    {i + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Tips */}
                          {recipe.tips && (
                            <div
                              className="mb-3 rounded-lg px-2.5 py-2 text-xs italic"
                              style={{ background: T.butterL, color: T.butterD }}
                            >
                              💡 {recipe.tips}
                            </div>
                          )}

                          {/* Delete button */}
                          {onDelete && (
                            <div className="pt-2 border-t" style={{ borderTopColor: T.border }}>
                              {isDeleting ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold" style={{ color: T.terra }}>
                                    Delete this recipe?
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="cursor-pointer rounded-lg border-none px-3 py-1.5 text-xs font-bold"
                                      style={{ background: T.border, color: T.brown }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleDelete(recipe.mealName)}
                                      className="cursor-pointer rounded-lg border-none px-3 py-1.5 text-xs font-bold"
                                      style={{ background: T.terra, color: "#fff" }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(recipe._id)}
                                  className="cursor-pointer rounded-lg border-none px-3 py-1.5 text-xs font-semibold"
                                  style={{ background: "transparent", color: T.terra }}
                                >
                                  🗑 Delete Recipe
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
