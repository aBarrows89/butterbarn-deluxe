"use client";

import { useState, useRef, useEffect } from "react";
import { T, MEAL_ICONS, type DayFull, type MealType } from "@/lib/constants";

interface EditSheetProps {
  day: DayFull;
  meal: MealType;
  initialValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function EditSheet({ day, meal, initialValue, onSave, onClose }: EditSheetProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSave = () => {
    onSave(value);
  };

  return (
    <div
      className="fixed z-[201] border animate-in slide-in-from-bottom-4"
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
      <div className="mb-1 text-[15px] font-bold" style={{ fontFamily: "var(--font-lora), serif" }}>
        {MEAL_ICONS[meal]} {day} {meal}
      </div>
      <div className="mb-3 text-[11.5px]" style={{ color: T.muted }}>
        What's on the menu?
      </div>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
        }}
        placeholder="e.g. Grilled Chicken & Roasted Veggies"
        rows={3}
        className="mb-3 w-full resize-none rounded-xl border p-3 text-sm leading-relaxed outline-none"
        style={{ background: T.bg, borderColor: T.border, color: T.brown }}
      />
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 cursor-pointer rounded-[13px] border py-3 text-[13px] font-bold"
          style={{ background: T.bg, borderColor: T.border, color: T.muted }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-[2] cursor-pointer rounded-[13px] border-none py-3 text-sm font-extrabold"
          style={{ background: T.butter, color: T.brown, boxShadow: "0 3px 12px rgba(212,146,10,0.4)" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
