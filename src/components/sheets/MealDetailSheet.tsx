"use client";

import { useState, useEffect } from "react";
import { T, MEAL_ICONS, type DayFull, type MealType } from "@/lib/constants";

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Recipe {
  butterQuip?: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: Array<{ item: string; amount: string }>;
  steps: string[];
  tips?: string;
}

interface SavedRecipe extends Recipe {
  _id: string;
  mealName: string;
  displayName: string;
  prepRating?: number;
  tasteRating?: number;
  timesUsed: number;
}

interface MealDetailSheetProps {
  day: DayFull;
  meal: MealType;
  mealName: string;
  nutrition?: Nutrition;
  rating: { prep: number; taste: number };
  savedRecipe?: SavedRecipe | null;
  guests: number;
  loading: boolean;
  loadLabel: string;
  onRatingChange: (field: "prep" | "taste", value: number) => void;
  onGetRecipe: (mealName: string, servings: number) => Promise<Recipe | null>;
  onSaveRecipe: (mealName: string, recipe: Recipe) => Promise<void>;
  onSwap: () => void;
  onEdit: () => void;
  onClose: () => void;
}

function Stars({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange(n)}
          className="cursor-pointer transition-colors"
          style={{ fontSize: size, color: n <= value ? T.butter : T.border }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex-1">
      <div className="mb-0.5 text-[9px] font-extrabold uppercase tracking-wide" style={{ color, letterSpacing: 0.5 }}>
        {label}
      </div>
      <div className="mb-0.5 h-1 overflow-hidden rounded-full" style={{ background: T.border }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[11px] font-bold" style={{ color }}>
        {value}g
      </div>
    </div>
  );
}

export function MealDetailSheet({
  day,
  meal,
  mealName,
  nutrition,
  rating,
  savedRecipe,
  guests,
  loading,
  loadLabel,
  onRatingChange,
  onGetRecipe,
  onSaveRecipe,
  onSwap,
  onEdit,
  onClose,
}: MealDetailSheetProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showRecipe, setShowRecipe] = useState(false);

  // Use saved recipe if available
  useEffect(() => {
    if (savedRecipe) {
      setRecipe(savedRecipe);
    }
  }, [savedRecipe]);

  const hasRecipe = recipe || savedRecipe;

  const handleGetRecipe = async () => {
    // If we already have a saved recipe, just show it
    if (savedRecipe) {
      setRecipe(savedRecipe);
      setShowRecipe(true);
      return;
    }

    // Generate new recipe
    const result = await onGetRecipe(mealName, guests);
    if (result) {
      setRecipe(result);
      setShowRecipe(true);
      // Save to recipe book
      await onSaveRecipe(mealName, result);
    }
  };

  return (
    <div
      className="fixed z-[201] max-h-[70vh] overflow-y-auto border animate-in slide-in-from-bottom-4"
      style={{
        background: T.card,
        borderColor: T.border,
        boxShadow: T.shadowLg,
        left: "var(--sheet-margin)",
        right: "var(--sheet-margin)",
        bottom: "var(--sheet-bottom)",
        borderRadius: "var(--sheet-radius)",
        padding: "var(--spacing-lg)",
      }}
    >
      <div className="mb-3.5 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold leading-tight" style={{ fontFamily: "var(--font-lora), serif" }}>
            {mealName}
          </div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: T.muted }}>
            {day} · {MEAL_ICONS[meal]} {meal}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={onSwap}
            disabled={loading}
            className="cursor-pointer rounded-lg border px-2.5 py-1.5 text-[11.5px] font-bold disabled:opacity-50"
            style={{ background: T.terraL, color: T.terra, borderColor: T.terra }}
          >
            Swap
          </button>
          <button
            onClick={onEdit}
            className="cursor-pointer rounded-lg border-none px-2.5 py-1.5 text-[11.5px] font-bold"
            style={{ background: T.butterL, color: T.butter }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Nutrition */}
      {nutrition ? (
        <div
          className="mb-4 rounded-[14px] border p-3.5"
          style={{ background: "linear-gradient(135deg,#EEF6EE,#F7FBF7)", borderColor: T.greenL }}
        >
          <div
            className="mb-2.5 text-[10px] font-extrabold uppercase tracking-wider"
            style={{ color: T.muted, letterSpacing: 1 }}
          >
            Nutrition · Per Person
          </div>
          <div className="flex items-center gap-2">
            <div className="border-r pr-2.5 text-center" style={{ borderRightColor: T.border }}>
              <div className="text-2xl font-extrabold leading-none" style={{ color: T.calories }}>
                {nutrition.calories}
              </div>
              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: T.muted }}>
                calories
              </div>
            </div>
            <div className="flex flex-1 gap-2">
              <MacroBar label="Protein" value={nutrition.protein} max={80} color={T.protein} />
              <MacroBar label="Carbs" value={nutrition.carbs} max={120} color={T.carbs} />
              <MacroBar label="Fat" value={nutrition.fat} max={60} color={T.fat} />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="mb-4 rounded-xl px-3.5 py-2.5 text-center text-xs"
          style={{ background: T.bg, color: T.muted }}
        >
          No nutrition data yet · Use AI to plan for auto-populated macros
        </div>
      )}

      {/* Recipe Section */}
      {!showRecipe ? (
        <button
          onClick={handleGetRecipe}
          disabled={loading}
          className="mb-4 w-full cursor-pointer rounded-[14px] border py-3 text-sm font-bold transition-all disabled:cursor-default disabled:opacity-50"
          style={{
            background: loading ? T.muted : hasRecipe ? T.greenL : T.terraL,
            color: loading ? "#fff" : hasRecipe ? T.green : T.terra,
            borderColor: loading ? T.muted : hasRecipe ? T.green : T.terra,
          }}
        >
          {loading ? `🧈 ${loadLabel}` : hasRecipe ? "📖 View Recipe" : "📖 Get Recipe"}
        </button>
      ) : recipe ? (
        <div
          className="mb-4 rounded-[14px] border p-3"
          style={{ background: T.terraL, borderColor: `${T.terra}40` }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div
              className="text-[11px] font-extrabold uppercase tracking-wide"
              style={{ color: T.terra, letterSpacing: 0.8 }}
            >
              Recipe
            </div>
            <button
              onClick={() => setShowRecipe(false)}
              className="cursor-pointer border-none bg-transparent text-xs font-bold"
              style={{ color: T.muted }}
            >
              Hide
            </button>
          </div>

          {/* Time & Servings */}
          <div className="mb-3 flex gap-3">
            <div className="rounded-lg px-2 py-1 text-center" style={{ background: T.card }}>
              <div className="text-[9px] font-bold uppercase" style={{ color: T.muted }}>Prep</div>
              <div className="text-xs font-bold" style={{ color: T.brown }}>{recipe.prepTime}</div>
            </div>
            <div className="rounded-lg px-2 py-1 text-center" style={{ background: T.card }}>
              <div className="text-[9px] font-bold uppercase" style={{ color: T.muted }}>Cook</div>
              <div className="text-xs font-bold" style={{ color: T.brown }}>{recipe.cookTime}</div>
            </div>
            <div className="rounded-lg px-2 py-1 text-center" style={{ background: T.card }}>
              <div className="text-[9px] font-bold uppercase" style={{ color: T.muted }}>Serves</div>
              <div className="text-xs font-bold" style={{ color: T.brown }}>{recipe.servings}</div>
            </div>
          </div>

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
          <div className="mb-2">
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
              className="rounded-lg px-2.5 py-2 text-xs italic"
              style={{ background: T.butterL, color: T.butterD }}
            >
              💡 {recipe.tips}
            </div>
          )}
        </div>
      ) : null}

      {/* Ratings */}
      <div className="mb-4">
        <div
          className="mb-3 text-[11px] font-extrabold uppercase tracking-wide"
          style={{ color: T.brown, letterSpacing: 0.8 }}
        >
          Your Ratings
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-xs font-bold" style={{ color: T.brown }}>
              ⏱ Prep — how easy was it?
            </div>
            <Stars value={rating.prep} onChange={(v) => onRatingChange("prep", v)} />
            <div className="mt-1 flex justify-between">
              <span className="text-[9.5px]" style={{ color: T.muted }}>
                Complicated
              </span>
              <span className="text-[9.5px]" style={{ color: T.muted }}>
                Super easy
              </span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-bold" style={{ color: T.brown }}>
              😋 Taste — would you make it again?
            </div>
            <Stars value={rating.taste} onChange={(v) => onRatingChange("taste", v)} />
            <div className="mt-1 flex justify-between">
              <span className="text-[9.5px]" style={{ color: T.muted }}>
                Not great
              </span>
              <span className="text-[9.5px]" style={{ color: T.muted }}>
                Make again!
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full cursor-pointer rounded-[14px] border-none py-3.5 text-sm font-extrabold"
        style={{ background: T.butter, color: T.brown, boxShadow: "0 3px 12px rgba(212,146,10,0.4)" }}
      >
        Done
      </button>
    </div>
  );
}
