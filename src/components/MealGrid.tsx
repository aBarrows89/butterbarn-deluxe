"use client";

import { T, DAYS_FULL, DAYS_SHORT, MEAL_TYPES, MEAL_ICONS, type DayFull, type MealType } from "@/lib/constants";

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealGridProps {
  meals: Record<DayFull, Record<MealType, string>>;
  nutrition: Record<string, Nutrition>;
  ratings: Record<string, { prep: number; taste: number }>;
  weekId: string;
  loading: boolean;
  loadLabel: string;
  onPlanFullWeek: () => void;
  onPlanDinners: () => void;
  onPlanLunches: () => void;
  onCellClick: (day: DayFull, meal: MealType) => void;
  onDayClick: (day: DayFull) => void;
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex-1">
      <div
        className="mb-0.5 text-[9.5px] font-extrabold uppercase tracking-wide"
        style={{ color, letterSpacing: 0.5 }}
      >
        {label}
      </div>
      <div className="mb-0.5 h-1 overflow-hidden rounded-full" style={{ background: T.border }}>
        <div
          className="h-full rounded-full transition-all duration-400"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="text-[11px] font-bold" style={{ color }}>
        {value}g
      </div>
    </div>
  );
}

function NutritionBadge({ n }: { n?: Nutrition }) {
  if (!n?.calories) return null;
  return (
    <div className="mt-0.5 text-[8.5px] font-bold tracking-wide" style={{ color: T.calories }}>
      {n.calories} cal
    </div>
  );
}

export function MealGrid({
  meals,
  nutrition,
  ratings,
  weekId,
  loading,
  loadLabel,
  onPlanFullWeek,
  onPlanDinners,
  onPlanLunches,
  onCellClick,
  onDayClick,
}: MealGridProps) {
  // Weekly nutrition totals
  const weeklyNutrition = Object.values(nutrition).reduce(
    (acc, n) => {
      if (!n) return acc;
      return {
        calories: (acc.calories || 0) + (n.calories || 0),
        protein: (acc.protein || 0) + (n.protein || 0),
        carbs: (acc.carbs || 0) + (n.carbs || 0),
        fat: (acc.fat || 0) + (n.fat || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const getRating = (day: DayFull, meal: MealType) => {
    const key = `${weekId}-${day}-${meal}`;
    return ratings[key] ?? { prep: 0, taste: 0 };
  };

  return (
    <div className="px-2.5 pb-28 pt-3">
      {/* Quick chips */}
      <div className="mb-2.5 flex gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={onPlanFullWeek}
          disabled={loading}
          className="shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-opacity disabled:cursor-default disabled:opacity-50"
          style={{
            background: loading ? T.muted : `linear-gradient(135deg,${T.butter},#E8A010)`,
            color: loading ? "#fff" : T.brown,
            boxShadow: loading ? "none" : "0 3px 10px rgba(212,146,10,0.35)",
          }}
        >
          📅 Plan Full Week
        </button>
        <button
          onClick={onPlanDinners}
          disabled={loading}
          className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-opacity disabled:cursor-default disabled:opacity-50"
          style={{
            background: loading ? T.muted : T.card,
            color: loading ? "#fff" : T.brown,
            borderColor: T.border,
          }}
        >
          🌙 Dinners Only
        </button>
        <button
          onClick={onPlanLunches}
          disabled={loading}
          className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-opacity disabled:cursor-default disabled:opacity-50"
          style={{
            background: loading ? T.muted : T.card,
            color: loading ? "#fff" : T.brown,
            borderColor: T.border,
          }}
        >
          ☀️ Lunches Only
        </button>
      </div>

      {/* Weekly nutrition summary */}
      {weeklyNutrition.calories > 0 && (
        <div
          className="mb-2.5 rounded-[14px] border p-3"
          style={{ background: T.card, borderColor: T.border, boxShadow: T.shadow }}
        >
          <div
            className="mb-2 text-[10px] font-extrabold uppercase tracking-wider"
            style={{ color: T.muted, letterSpacing: 1 }}
          >
            Weekly Avg Per Day · Per Person
          </div>
          <div className="flex items-center gap-1.5">
            <div className="mr-1.5 shrink-0 text-center">
              <div className="text-xl font-extrabold leading-none" style={{ color: T.calories }}>
                {Math.round(weeklyNutrition.calories / 7)}
              </div>
              <div
                className="mt-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{ color: T.muted }}
              >
                cal/day
              </div>
            </div>
            <div className="flex flex-1 gap-2">
              <MacroBar label="Protein" value={Math.round(weeklyNutrition.protein / 7)} max={200} color={T.protein} />
              <MacroBar label="Carbs" value={Math.round(weeklyNutrition.carbs / 7)} max={300} color={T.carbs} />
              <MacroBar label="Fat" value={Math.round(weeklyNutrition.fat / 7)} max={100} color={T.fat} />
            </div>
          </div>
        </div>
      )}

      {/* Grid header */}
      <div className="mb-0.5 grid grid-cols-[42px_repeat(7,1fr)] gap-0.5">
        <div />
        {DAYS_FULL.map((d, i) => (
          <button
            key={d}
            onClick={() => onDayClick(d)}
            className="cursor-pointer rounded-lg border border-transparent bg-transparent p-1 text-center text-[9px] font-extrabold uppercase tracking-wide transition-colors hover:border-[#EDE3D8]"
            style={{ color: T.butter }}
          >
            {DAYS_SHORT[i]}
          </button>
        ))}
      </div>

      {/* Meal rows */}
      {MEAL_TYPES.map((meal) => (
        <div key={meal} className="mb-0.5 grid grid-cols-[42px_repeat(7,1fr)] gap-0.5">
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-xs">{MEAL_ICONS[meal]}</span>
            <span className="text-[7px] font-extrabold uppercase tracking-tight" style={{ color: T.muted }}>
              {meal.slice(0, 3)}
            </span>
          </div>
          {DAYS_FULL.map((day) => {
            const val = meals[day]?.[meal] || "";
            const nk = `${day}-${meal}`;
            const n = nutrition[nk];
            const rating = getRating(day, meal);
            return (
              <div
                key={day}
                onClick={() => onCellClick(day, meal)}
                className="relative flex min-h-[60px] cursor-pointer flex-col items-center justify-center rounded-[10px] border p-1 transition-all active:scale-95"
                style={{
                  background: val ? T.greenL : T.card,
                  borderColor: val ? T.checked : T.border,
                  boxShadow: val ? "none" : T.shadow,
                }}
              >
                <span
                  className="text-center text-[9px] leading-tight"
                  style={{ color: val ? T.brown : "#D0C4BB" }}
                >
                  {val || "+"}
                </span>
                <NutritionBadge n={n} />
                {rating.taste > 0 && (
                  <div className="mt-0.5 text-[7px]" style={{ color: T.butter }}>
                    {"★".repeat(rating.taste)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="mt-3.5 text-center text-[11px]" style={{ color: T.muted }}>
        Tap empty cell to edit · Tap meal for details & ratings · 🧈 to ask Butter
      </div>
    </div>
  );
}
