"use client";

import { T, MEAL_ICONS, type DayFull, type MealType } from "@/lib/constants";

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealDetailSheetProps {
  day: DayFull;
  meal: MealType;
  mealName: string;
  nutrition?: Nutrition;
  rating: { prep: number; taste: number };
  onRatingChange: (field: "prep" | "taste", value: number) => void;
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
  onRatingChange,
  onEdit,
  onClose,
}: MealDetailSheetProps) {
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
        <div>
          <div className="text-base font-bold leading-tight" style={{ fontFamily: "var(--font-lora), serif" }}>
            {mealName}
          </div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: T.muted }}>
            {day} · {MEAL_ICONS[meal]} {meal}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="shrink-0 cursor-pointer rounded-lg border-none px-2.5 py-1.5 text-[11.5px] font-bold"
          style={{ background: T.butterL, color: T.butter }}
        >
          Edit
        </button>
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
