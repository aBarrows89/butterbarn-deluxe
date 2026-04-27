"use client";

import { T, DAYS_FULL, MEAL_TYPES, MEAL_ICONS, type DayFull, type MealType } from "@/lib/constants";

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface PlanResponse {
  butterQuip: string;
  meals: Record<string, Record<string, string>>;
  nutrition: Record<string, Nutrition>;
  shoppingList: Array<{
    ingredient: string;
    quantity: string;
    unit: string;
    meal: string;
    mealKey: string;
    category: string;
  }>;
}

interface PreviewSheetProps {
  plan: PlanResponse;
  onAccept: () => void;
  onReject: () => void;
}

export function PreviewSheet({ plan, onAccept, onReject }: PreviewSheetProps) {
  const { meals, butterQuip, shoppingList } = plan;

  // Count filled meals
  let filledCount = 0;
  for (const day of DAYS_FULL) {
    for (const meal of MEAL_TYPES) {
      if (meals[day]?.[meal]) filledCount++;
    }
  }

  return (
    <div
      className="fixed z-[60] flex flex-col overflow-hidden rounded-t-3xl border-t animate-in slide-in-from-bottom duration-300"
      style={{
        left: "var(--sheet-margin)",
        right: "var(--sheet-margin)",
        bottom: "calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))",
        maxHeight: "70vh",
        background: T.card,
        borderTopColor: T.border,
        boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3" style={{ borderBottomColor: T.border }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold" style={{ fontFamily: "var(--font-lora), serif", fontSize: "clamp(14px, 4vw, 18px)" }}>
              Butter's Suggestion
            </div>
            <div style={{ color: T.muted, fontSize: "clamp(10px, 2.5vw, 12px)" }}>
              {filledCount} meals planned
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="cursor-pointer rounded-full border font-bold"
              style={{
                background: T.card,
                color: T.muted,
                borderColor: T.border,
                padding: "6px 14px",
                fontSize: "clamp(11px, 2.8vw, 13px)",
              }}
            >
              Redo
            </button>
            <button
              onClick={onAccept}
              className="cursor-pointer rounded-full border-none font-bold"
              style={{
                background: T.butter,
                color: T.brown,
                padding: "6px 14px",
                fontSize: "clamp(11px, 2.8vw, 13px)",
                boxShadow: "0 2px 8px rgba(212,146,10,0.3)",
              }}
            >
              Accept
            </button>
          </div>
        </div>
        {butterQuip && (
          <div
            className="mt-2 rounded-xl px-3 py-2 text-sm italic"
            style={{ background: T.butterL, color: T.butterD }}
          >
            "{butterQuip}"
          </div>
        )}
      </div>

      {/* Scrollable meal list */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-2" style={{ WebkitOverflowScrolling: "touch" }}>
        {DAYS_FULL.map((day) => {
          const dayMeals = meals[day] || {};
          const hasMeals = MEAL_TYPES.some((m) => dayMeals[m]);
          if (!hasMeals) return null;

          return (
            <div key={day} className="mb-2">
              <div
                className="mb-1 font-extrabold uppercase"
                style={{ color: T.butter, fontSize: "clamp(9px, 2.2vw, 11px)", letterSpacing: "0.5px" }}
              >
                {day}
              </div>
              <div
                className="rounded-lg border"
                style={{ background: T.bg, borderColor: T.border, padding: "clamp(6px, 1.5vw, 10px)" }}
              >
                {MEAL_TYPES.map((mealType, idx) => {
                  const mealName = dayMeals[mealType];
                  if (!mealName) return null;
                  const isFirst = MEAL_TYPES.slice(0, idx).every((m) => !dayMeals[m]);
                  return (
                    <div
                      key={mealType}
                      className="flex items-center gap-1.5"
                      style={{
                        borderTop: !isFirst ? `1px solid ${T.border}` : "none",
                        padding: "clamp(4px, 1vw, 6px) 0",
                      }}
                    >
                      <span style={{ fontSize: "clamp(11px, 2.5vw, 14px)" }}>
                        {MEAL_ICONS[mealType]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-bold uppercase"
                          style={{ color: T.muted, fontSize: "clamp(8px, 2vw, 9px)", letterSpacing: "0.3px" }}
                        >
                          {mealType}
                        </div>
                        <div
                          className="truncate font-semibold"
                          style={{ color: T.brown, fontSize: "clamp(11px, 2.8vw, 13px)" }}
                        >
                          {mealName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Shopping list summary */}
        {shoppingList && shoppingList.length > 0 && (
          <div className="mt-2 mb-2">
            <div
              className="mb-1.5 text-xs font-extrabold uppercase tracking-wider"
              style={{ color: T.green }}
            >
              Shopping List ({shoppingList.length} items)
            </div>
            <div
              className="rounded-xl border p-3"
              style={{ background: T.greenL, borderColor: T.checked }}
            >
              <div className="flex flex-wrap gap-1">
                {shoppingList.slice(0, 12).map((item, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: T.card, color: T.brown }}
                  >
                    {item.ingredient}
                  </span>
                ))}
                {shoppingList.length > 12 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: T.card, color: T.muted }}
                  >
                    +{shoppingList.length - 12} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
