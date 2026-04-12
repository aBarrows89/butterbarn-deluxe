"use client";

import { useRef } from "react";
import { T, DAYS_FULL, DAYS_SHORT, getWeekDateRange, getCurrentWeekId, type DayFull, type MealType } from "@/lib/constants";

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
  onWeekChange: (direction: -1 | 1) => void;
}

function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < count ? T.butter : T.border, fontSize: "10px" }}>★</span>
      ))}
    </span>
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
  onCellClick,
  onDayClick,
  onWeekChange,
}: MealGridProps) {
  const currentWeekId = getCurrentWeekId();
  const isCurrentWeek = weekId === currentWeekId;
  const { start, end } = getWeekDateRange(weekId);
  const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

  // Get dates for each day of the week
  const weekDates = DAYS_FULL.map((_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Today's index (0-6, or -1 if today is not in this week)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight for comparison
  const todayIndex = weekDates.findIndex(d => {
    const compareDate = new Date(d);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  });

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      onWeekChange(deltaX > 0 ? -1 : 1);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

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

  const plannedCount = DAYS_FULL.filter(day => meals[day]?.Dinner).length;

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ padding: "16px 24px" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Week navigation */}
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <button
          onClick={() => onWeekChange(-1)}
          className="cursor-pointer rounded-full border-none flex items-center justify-center"
          style={{ background: T.butterL, color: T.butterD, width: 36, height: 36, fontSize: 18 }}
        >
          ←
        </button>
        <div className="text-center">
          <div className="font-bold" style={{ fontFamily: "var(--font-lora), serif", fontSize: 16, color: T.brown }}>
            {monthFormat.format(start)} – {monthFormat.format(end)}
          </div>
          {isCurrentWeek && (
            <div className="font-semibold" style={{ fontSize: 11, color: T.butter }}>
              This Week
            </div>
          )}
        </div>
        <button
          onClick={() => onWeekChange(1)}
          className="cursor-pointer rounded-full border-none flex items-center justify-center"
          style={{ background: T.butterL, color: T.butterD, width: 36, height: 36, fontSize: 18 }}
        >
          →
        </button>
      </div>

      {/* Plan button */}
      <button
        onClick={onPlanFullWeek}
        disabled={loading}
        className="mb-3 shrink-0 cursor-pointer rounded-2xl border-none font-bold transition-opacity disabled:cursor-default disabled:opacity-50"
        style={{
          background: loading ? T.muted : `linear-gradient(135deg, ${T.butter}, #E8A010)`,
          color: loading ? "#fff" : T.brown,
          boxShadow: loading ? "none" : "0 4px 16px rgba(212,146,10,0.35)",
          padding: "14px 20px",
          fontSize: 15,
        }}
      >
        {loading ? `🧈 ${loadLabel}` : `🌙 Plan This Week's Dinners`}
      </button>

      {/* Stats row */}
      <div className="mb-3 flex shrink-0 gap-2">
        <div className="flex-1 rounded-2xl text-center" style={{ background: T.greenL, padding: "10px 12px" }}>
          <div className="text-lg font-extrabold" style={{ color: T.green }}>{plannedCount}/7</div>
          <div className="text-[10px] font-semibold" style={{ color: T.muted }}>Planned</div>
        </div>
        {weeklyNutrition.calories > 0 && (
          <div className="flex-1 rounded-2xl text-center" style={{ background: T.butterL, padding: "10px 12px" }}>
            <div className="text-lg font-extrabold" style={{ color: T.butterD }}>{Math.round(weeklyNutrition.calories / 7)}</div>
            <div className="text-[10px] font-semibold" style={{ color: T.muted }}>Cal/Day</div>
          </div>
        )}
      </div>

      {/* Dinner cards */}
      <div className="min-h-0 flex-1 overflow-y-auto" style={{ paddingBottom: 100 }}>
        {DAYS_FULL.map((day, i) => {
          const dinner = meals[day]?.Dinner || "";
          const isToday = i === todayIndex;
          const isPast = isCurrentWeek && i < todayIndex;
          const nKey = `${day}-Dinner`;
          const n = nutrition[nKey];
          const rating = ratings[`${weekId}-${day}-Dinner`];

          return (
            <div
              key={day}
              onClick={() => dinner ? onCellClick(day, "Dinner") : onDayClick(day)}
              className="mb-2 cursor-pointer rounded-2xl transition-all active:scale-[0.98]"
              style={{
                background: dinner ? T.card : (isToday ? T.butterL : T.bg),
                border: `2px solid ${isToday ? T.butter : dinner ? T.border : "transparent"}`,
                boxShadow: dinner ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                padding: "14px 16px",
                opacity: isPast && !dinner ? 0.5 : 1,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Day indicator */}
                  <div
                    className="flex flex-col items-center justify-center rounded-xl"
                    style={{
                      background: isToday ? T.butter : (dinner ? T.greenL : T.card),
                      width: 44,
                      height: 44,
                    }}
                  >
                    <div className="text-[10px] font-bold uppercase" style={{ color: isToday ? "#fff" : T.muted }}>
                      {DAYS_SHORT[i]}
                    </div>
                    <div className="text-sm font-extrabold" style={{ color: isToday ? "#fff" : T.brown }}>
                      {weekDates[i].getDate()}
                    </div>
                  </div>

                  {/* Meal info */}
                  <div className="flex-1 min-w-0">
                    {dinner ? (
                      <>
                        <div className="font-bold capitalize" style={{ color: T.brown, fontSize: 14 }}>
                          {dinner}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {n?.calories && (
                            <span className="text-[11px] font-semibold" style={{ color: T.calories }}>
                              {n.calories} cal
                            </span>
                          )}
                          {rating?.taste ? (
                            <Stars count={rating.taste} />
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div className="font-semibold" style={{ color: T.muted, fontSize: 13 }}>
                        {isToday ? "What's for dinner tonight?" : "Tap to plan"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ color: dinner ? T.butter : T.muted, fontSize: 18 }}>
                  →
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
