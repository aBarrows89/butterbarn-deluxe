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
      className="flex shrink-0 items-start gap-2 border-b px-3.5 py-2 animate-in fade-in slide-in-from-top-1 duration-300"
      style={{
        background: "linear-gradient(135deg,#FDF3D8,#FFF9EE)",
        borderBottomColor: "#EDD98A",
      }}
    >
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px]"
        style={{
          background: "linear-gradient(135deg,#D4920A,#F0A820)",
          boxShadow: "0 2px 8px rgba(212,146,10,0.35)",
        }}
      >
        🧈
      </div>
      <div
        className="flex-1 pt-0.5 text-[11.5px] font-semibold italic leading-relaxed"
        style={{ color: T.butterD }}
      >
        "{quip}"
      </div>
    </div>
  );
}
