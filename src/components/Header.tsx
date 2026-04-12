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
      className="flex shrink-0 items-center justify-between"
      style={{ background: T.headerBg, padding: "clamp(8px, 2vh, 12px) clamp(12px, 3vw, 16px)" }}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: "clamp(18px, 5vw, 24px)", filter: "drop-shadow(0 2px 6px rgba(212,146,10,0.5))" }}>
          🧈
        </span>
        <div>
          <div
            className="font-bold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-lora), serif", color: T.butter, fontSize: "clamp(14px, 4vw, 18px)" }}
          >
            Butter Barn
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onGrandmaModeToggle}
          className="flex cursor-pointer items-center gap-0.5 rounded-full border transition-all"
          style={{
            background: grandmaMode ? "rgba(212,146,10,0.3)" : "rgba(212,146,10,0.08)",
            borderColor: grandmaMode ? "rgba(212,146,10,0.55)" : "rgba(212,146,10,0.2)",
            padding: "clamp(4px, 1vh, 6px) clamp(8px, 2vw, 12px)",
          }}
        >
          <span style={{ fontSize: "clamp(10px, 2.5vw, 14px)" }}>👵</span>
          <span
            className="whitespace-nowrap font-extrabold"
            style={{ color: grandmaMode ? "#FFD97A" : "rgba(212,146,10,0.65)", fontSize: "clamp(8px, 2vw, 11px)" }}
          >
            {grandmaMode ? "✓" : "+"}
          </span>
        </button>

        <div
          className="flex items-center gap-1 rounded-full border"
          style={{ background: "rgba(212,146,10,0.1)", borderColor: "rgba(212,146,10,0.2)", padding: "clamp(4px, 1vh, 6px) clamp(8px, 2vw, 12px)" }}
        >
          <button
            onClick={() => onGuestsChange(-1)}
            className="cursor-pointer border-none bg-transparent font-extrabold leading-none"
            style={{ color: T.butter, fontSize: "clamp(12px, 3vw, 16px)" }}
          >
            −
          </button>
          <span className="text-center font-extrabold text-white" style={{ fontSize: "clamp(11px, 2.5vw, 14px)", minWidth: "1.2em" }}>{guests}</span>
          <button
            onClick={() => onGuestsChange(1)}
            className="cursor-pointer border-none bg-transparent font-extrabold leading-none"
            style={{ color: T.butter, fontSize: "clamp(12px, 3vw, 16px)" }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
