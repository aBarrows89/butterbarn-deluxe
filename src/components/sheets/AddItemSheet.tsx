"use client";

import { useState } from "react";
import { T } from "@/lib/constants";

interface ShoppingItem {
  id: string;
  ingredient: string;
  quantity: string;
  unit: string;
  meal: string;
  mealKey?: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
  haveIt?: boolean;
}

interface AddItemSheetProps {
  onAdd: (item: ShoppingItem) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "Household", label: "🏠 Household" },
  { value: "Produce", label: "🥦 Produce" },
  { value: "Meat & Seafood", label: "🥩 Meat & Seafood" },
  { value: "Dairy & Eggs", label: "🥛 Dairy & Eggs" },
  { value: "Pantry", label: "🫙 Pantry" },
  { value: "Frozen", label: "🧊 Frozen" },
  { value: "Bakery", label: "🍞 Bakery" },
  { value: "Beverages", label: "🧃 Beverages" },
  { value: "Other", label: "📦 Other" },
];

export function AddItemSheet({ onAdd, onClose }: AddItemSheetProps) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [category, setCategory] = useState("Household");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      ingredient: name.trim(),
      quantity: qty,
      unit: "",
      meal: "Household",
      category,
      checked: false,
    });
    setName("");
    setQty("1");
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
      <div className="mb-3.5 text-base font-bold" style={{ fontFamily: "var(--font-lora), serif" }}>
        Add Item to List
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="Item name (e.g. Paper Towels, Dish Soap)"
        className="mb-2.5 w-full rounded-xl border px-3.5 py-3 text-sm outline-none"
        style={{ background: T.bg, borderColor: T.border, color: T.brown }}
        autoFocus
      />
      <div className="mb-3.5 flex gap-2">
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Qty"
          className="w-16 rounded-xl border px-3 py-3 text-sm outline-none"
          style={{ background: T.bg, borderColor: T.border, color: T.brown }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 cursor-pointer rounded-xl border px-3 py-3 text-[13px] outline-none"
          style={{ background: T.bg, borderColor: T.border, color: T.brown }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 cursor-pointer rounded-[13px] border py-3 text-[13px] font-bold"
          style={{ background: T.bg, borderColor: T.border, color: T.muted }}
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="flex-[2] cursor-pointer rounded-[13px] border-none py-3 text-sm font-extrabold"
          style={{
            background: name.trim() ? T.household : "#C8BAB0",
            color: "#fff",
            boxShadow: name.trim() ? "0 3px 10px rgba(107,127,212,0.4)" : "none",
          }}
        >
          ＋ Add to List
        </button>
      </div>
    </div>
  );
}
