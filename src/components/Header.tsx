"use client";

import { T } from "@/lib/constants";

interface HeaderProps {
  guests: number;
  grandmaMode: boolean;
  onGuestsChange: (delta: number) => void;
  onGrandmaModeToggle: () => void;
}

export function Header({ guests, grandmaMode, onGuestsChange, onGrandmaModeToggle }: HeaderProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-4 py-3"
      style={{ background: T.headerBg }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl" style={{ filter: "drop-shadow(0 2px 6px rgba(212,146,10,0.5))" }}>
          🧈
        </span>
        <div>
          <div
            className="text-lg font-bold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-lora), serif", color: T.butter }}
          >
            Butter Barn
          </div>
          <div
            className="text-[8px] font-extrabold uppercase tracking-[3px]"
            style={{ color: "rgba(212,146,10,0.4)" }}
          >
            Deluxe
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onGrandmaModeToggle}
          className="flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 transition-all"
          style={{
            background: grandmaMode ? "rgba(212,146,10,0.3)" : "rgba(212,146,10,0.08)",
            borderColor: grandmaMode ? "rgba(212,146,10,0.55)" : "rgba(212,146,10,0.2)",
          }}
        >
          <span className="text-sm">👵</span>
          <span
            className="whitespace-nowrap text-[10.5px] font-extrabold"
            style={{ color: grandmaMode ? "#FFD97A" : "rgba(212,146,10,0.65)" }}
          >
            {grandmaMode ? "Grandma ✓" : "+ Grandma"}
          </span>
        </button>

        <div
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5"
          style={{ background: "rgba(212,146,10,0.1)", borderColor: "rgba(212,146,10,0.2)" }}
        >
          <span className="text-[11px]" style={{ color: T.butter }}>
            👥
          </span>
          <button
            onClick={() => onGuestsChange(-1)}
            className="cursor-pointer border-none bg-transparent text-base font-extrabold leading-none"
            style={{ color: T.butter, width: 20 }}
          >
            −
          </button>
          <span className="min-w-4 text-center text-[13px] font-extrabold text-white">{guests}</span>
          <button
            onClick={() => onGuestsChange(1)}
            className="cursor-pointer border-none bg-transparent text-base font-extrabold leading-none"
            style={{ color: T.butter, width: 20 }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
