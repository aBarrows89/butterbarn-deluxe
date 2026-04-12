"use client";

import { useState } from "react";
import { T, MEAL_TYPES, MEAL_ICONS, type DayFull, type MealType } from "@/lib/constants";

interface DaySheetProps {
  day: DayFull;
  meals: Record<MealType, string>;
  loading: boolean;
  loadLabel: string;
  onPlan: (day: DayFull, customPrompt?: string) => void;
  onEditMeal: (meal: MealType) => void;
  onClose: () => void;
}

export function DaySheet({ day, meals, loading, loadLabel, onPlan, onEditMeal, onClose }: DaySheetProps) {
  const [prompt, setPrompt] = useState("");

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
      {/* Header */}
      <div className="mb-3.5 flex items-center justify-between">
        <div>
          <div className="text-[17px] font-bold" style={{ fontFamily: "var(--font-lora), serif" }}>
            {day}
          </div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: T.muted }}>
            Tap Butter to auto-plan · or edit each meal below
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border text-sm"
          style={{ background: T.bg, borderColor: T.border, color: T.muted }}
        >
          ✕
        </button>
      </div>

      {/* Current meals for this day */}
      <div className="mb-3.5 flex flex-col gap-2">
        {MEAL_TYPES.map((meal) => {
          const val = meals?.[meal] || "";
          return (
            <div
              key={meal}
              onClick={() => onEditMeal(meal)}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5"
              style={{
                background: val ? T.greenL : T.bg,
                borderColor: val ? T.checked : T.border,
              }}
            >
              <span className="shrink-0 text-base">{MEAL_ICONS[meal]}</span>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ color: T.muted, letterSpacing: 0.8 }}
                >
                  {meal}
                </div>
                <div
                  className="mt-0.5 text-[12.5px]"
                  style={{ color: val ? T.brown : T.muted, fontWeight: val ? 600 : 400 }}
                >
                  {val || "Tap to set"}
                </div>
              </div>
              <span className="text-xs" style={{ color: T.muted }}>
                ›
              </span>
            </div>
          );
        })}
      </div>

      {/* Custom prompt */}
      <div className="mb-2.5">
        <div
          className="mb-1.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ color: T.muted, letterSpacing: 0.8 }}
        >
          Tell Butter the vibe
        </div>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onPlan(day, prompt)}
          placeholder={`e.g. "Quick and easy" · "Something Italian" · "Light meals"`}
          className="w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
          style={{ background: T.bg, borderColor: T.border, color: T.brown }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onPlan(day, "")}
          disabled={loading}
          className="flex-1 cursor-pointer rounded-[13px] border-none py-3 text-[13px] font-extrabold"
          style={{
            background: loading ? T.muted : `linear-gradient(135deg,${T.butter},#E8A010)`,
            color: loading ? "#fff" : T.brown,
            boxShadow: loading ? "none" : "0 3px 12px rgba(212,146,10,0.4)",
          }}
        >
          {loading ? loadLabel : "🧈 Let Butter Decide"}
        </button>
        {prompt.trim() && (
          <button
            onClick={() => onPlan(day, prompt)}
            disabled={loading}
            className="flex-1 cursor-pointer rounded-[13px] border-none py-3 text-[13px] font-extrabold"
            style={{
              background: loading ? T.muted : T.green,
              color: "#fff",
              boxShadow: loading ? "none" : "0 3px 12px rgba(74,122,77,0.4)",
            }}
          >
            ✦ Plan It
          </button>
        )}
      </div>
    </div>
  );
}
