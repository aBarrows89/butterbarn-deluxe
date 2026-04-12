"use client";

import { T } from "@/lib/constants";

interface ButterQuipProps {
  quip: string;
  quipKey: number;
}

export function ButterQuip({ quip, quipKey }: ButterQuipProps) {
  return (
    <div
      key={quipKey}
      className="flex shrink-0 items-center gap-1.5 border-b animate-in fade-in slide-in-from-top-1 duration-300"
      style={{
        background: "linear-gradient(135deg,#FDF3D8,#FFF9EE)",
        borderBottomColor: "#EDD98A",
        padding: "clamp(6px, 1.5vh, 10px) clamp(10px, 2.5vw, 14px)",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: "clamp(20px, 5vw, 28px)",
          height: "clamp(20px, 5vw, 28px)",
          fontSize: "clamp(10px, 2.5vw, 14px)",
          background: "linear-gradient(135deg,#D4920A,#F0A820)",
          boxShadow: "0 2px 6px rgba(212,146,10,0.35)",
        }}
      >
        🧈
      </div>
      <div
        className="flex-1 font-semibold italic leading-snug overflow-hidden"
        style={{
          color: T.butterD,
          fontSize: "clamp(9px, 2.2vw, 12px)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        "{quip}"
      </div>
    </div>
  );
}
