"use client";

import { useState, useRef, useEffect } from "react";
import { T } from "@/lib/constants";

interface ChatSheetProps {
  loading: boolean;
  loadLabel: string;
  onSubmit: (prompt: string) => Promise<void>;
  onClose: () => void;
}

export function ChatSheet({ loading, loadLabel, onSubmit, onClose }: ChatSheetProps) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    await onSubmit(prompt);
    setPrompt("");
  };

  return (
    <div
      className="fixed z-[201] overflow-hidden border animate-in slide-in-from-bottom-4"
      style={{
        background: T.card,
        borderColor: T.border,
        boxShadow: T.shadowLg,
        left: "var(--sheet-margin)",
        right: "var(--sheet-margin)",
        bottom: "var(--sheet-bottom)",
        borderRadius: "var(--sheet-radius)",
      }}
    >
      <div
        className="flex items-start gap-2.5"
        style={{ padding: "var(--spacing-md)" }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: "clamp(28px, 7vw, 36px)",
            height: "clamp(28px, 7vw, 36px)",
            fontSize: "var(--font-sm)",
            background: "linear-gradient(135deg,#D4920A,#F0A820)",
            boxShadow: "0 2px 8px rgba(212,146,10,0.4)",
          }}
        >
          🧈
        </div>
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={`Tell Butter what you want...\n"Plan a cozy week" · "Change Friday to tacos"`}
          rows={2}
          className="flex-1 resize-none border-none bg-transparent pt-1 font-medium leading-relaxed outline-none"
          style={{ color: T.brown, fontSize: "var(--font-sm)" }}
        />
      </div>
      <div
        className="flex items-center justify-between"
        style={{ background: T.bg, padding: "var(--spacing-sm) var(--spacing-md)" }}
      >
        <button
          onClick={onClose}
          className="cursor-pointer border-none bg-transparent font-semibold"
          style={{ color: T.muted, fontSize: "var(--font-sm)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
          className="cursor-pointer rounded-full border-none font-extrabold transition-all"
          style={{
            fontSize: "var(--font-sm)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: loading || !prompt.trim() ? "#C8BAB0" : T.butter,
            color: loading || !prompt.trim() ? "#fff" : T.brown,
            boxShadow: loading || !prompt.trim() ? "none" : "0 3px 12px rgba(212,146,10,0.4)",
          }}
        >
          {loading ? loadLabel : "✦ Update Plan"}
        </button>
      </div>
    </div>
  );
}
