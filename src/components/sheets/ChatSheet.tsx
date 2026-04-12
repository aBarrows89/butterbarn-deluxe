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
      className="fixed inset-x-3.5 bottom-[72px] z-[201] overflow-hidden rounded-[22px] border animate-in slide-in-from-bottom-4"
      style={{ background: T.card, borderColor: T.border, boxShadow: T.shadowLg }}
    >
      <div className="flex items-start gap-2.5 px-4 pb-2.5 pt-3.5">
        <div
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[13px]"
          style={{
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
          placeholder={`Tell Butter what you want...\n"Plan a cozy week" · "Change Friday to tacos" · "Add paper towels"`}
          rows={2}
          className="flex-1 resize-none border-none bg-transparent pt-1 text-[13.5px] font-medium leading-relaxed outline-none"
          style={{ color: T.brown }}
        />
      </div>
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: T.bg }}
      >
        <button
          onClick={onClose}
          className="cursor-pointer border-none bg-transparent text-[13px] font-semibold"
          style={{ color: T.muted }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
          className="cursor-pointer rounded-full border-none px-5 py-2.5 text-[13px] font-extrabold transition-all"
          style={{
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
