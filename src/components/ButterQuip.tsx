"use client";

import { useState } from "react";
import { T } from "@/lib/constants";

interface ButterQuipProps {
  quip: string;
  quipKey: number;
}

export function ButterQuip({ quip, quipKey }: ButterQuipProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = quip.length > 80;

  return (
    <div
      key={quipKey}
      onClick={() => isLong && setExpanded(!expanded)}
      className="flex shrink-0 items-start gap-1.5 border-b animate-in fade-in slide-in-from-top-1 duration-300"
      style={{
        background: "linear-gradient(135deg,#FDF3D8,#FFF9EE)",
        borderBottomColor: "#EDD98A",
        padding: "clamp(10px, 2.5vh, 14px) clamp(20px, 5vw, 24px)",
        cursor: isLong ? "pointer" : "default",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: "clamp(22px, 5.5vw, 30px)",
          height: "clamp(22px, 5.5vw, 30px)",
          fontSize: "clamp(11px, 2.8vw, 15px)",
          background: "linear-gradient(135deg,#D4920A,#F0A820)",
          boxShadow: "0 2px 6px rgba(212,146,10,0.35)",
        }}
      >
        🧈
      </div>
      <div
        className="flex-1 font-semibold italic leading-snug"
        style={{
          color: T.butterD,
          fontSize: "clamp(11px, 2.8vw, 13px)",
          overflow: expanded ? "visible" : "hidden",
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? undefined : 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        "{quip}"
        {isLong && !expanded && (
          <span style={{ color: T.butter, fontWeight: 700 }}> ...</span>
        )}
      </div>
    </div>
  );
}
