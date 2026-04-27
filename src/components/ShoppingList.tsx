"use client";

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

interface ConsolidatedItem extends ShoppingItem {
  originalIds: string[];
  meals: string[];
  totalQuantity: string;
}

// Try to parse quantity as a number
function parseQuantity(qty: string): number | null {
  const cleaned = qty.replace(/[^\d.\/]/g, "").trim();
  if (!cleaned) return null;
  // Handle fractions like "1/2"
  if (cleaned.includes("/")) {
    const [num, denom] = cleaned.split("/");
    return parseFloat(num) / parseFloat(denom);
  }
  return parseFloat(cleaned);
}

// Consolidate duplicate ingredients
function consolidateIngredients(items: ShoppingItem[]): ConsolidatedItem[] {
  const map = new Map<string, ConsolidatedItem>();

  for (const item of items) {
    // Normalize ingredient name for grouping
    const key = `${item.ingredient.toLowerCase().trim()}|${item.unit.toLowerCase().trim()}|${item.category}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.originalIds.push(item.id);
      if (!existing.meals.includes(item.meal)) {
        existing.meals.push(item.meal);
      }
      // Try to add quantities
      const existingQty = parseQuantity(existing.totalQuantity);
      const newQty = parseQuantity(item.quantity);
      if (existingQty !== null && newQty !== null) {
        const total = existingQty + newQty;
        // Format nicely (avoid 1.9999999)
        existing.totalQuantity = total % 1 === 0 ? String(total) : total.toFixed(1).replace(/\.0$/, "");
      } else {
        // Can't add, just append
        existing.totalQuantity = `${existing.totalQuantity} + ${item.quantity}`;
      }
      // Item is checked only if ALL originals are checked
      existing.checked = existing.checked && item.checked;
    } else {
      map.set(key, {
        ...item,
        originalIds: [item.id],
        meals: [item.meal],
        totalQuantity: item.quantity,
      });
    }
  }

  return Array.from(map.values());
}

interface PriceEntry {
  ingredientKey: string;
  displayName: string;
  entries: Array<{ date: string; price: number; store: string }>;
}

interface ShoppingListProps {
  items: ShoppingItem[];
  listFilter: "All" | "Food" | "Household";
  priceHistory: PriceEntry[];
  onFilterChange: (filter: "All" | "Food" | "Household") => void;
  onToggleItem: (itemId: string) => void;
  onAddItemClick: () => void;
  onClearChecked: () => void;
  onUncheckAll: () => void;
}

function getBestStore(name: string, priceHistory: PriceEntry[]): { store: string; avg: number } | "no_data" | null {
  const nameLower = name.toLowerCase().trim();
  const words = nameLower.split(/\s+/);

  // Try exact match first, then partial matches
  let matches = priceHistory.filter((p) => p.ingredientKey === nameLower);
  if (!matches.length) {
    // Try matching any word from the ingredient name
    matches = priceHistory.filter((p) =>
      words.some((w) => w.length > 2 && p.ingredientKey.includes(w))
    );
  }
  if (!matches.length) {
    // Try if price history key is contained in ingredient name
    matches = priceHistory.filter((p) =>
      nameLower.includes(p.ingredientKey) || p.ingredientKey.includes(words[0])
    );
  }

  if (!matches.length) return "no_data";

  const storeMap: Record<string, { total: number; count: number }> = {};
  matches.forEach((m) =>
    m.entries.forEach((e) => {
      if (!storeMap[e.store]) storeMap[e.store] = { total: 0, count: 0 };
      storeMap[e.store].total += e.price;
      storeMap[e.store].count++;
    })
  );

  const avgs = Object.entries(storeMap)
    .map(([store, { total, count }]) => ({ store, avg: total / count }))
    .sort((a, b) => a.avg - b.avg);

  return avgs[0] || "no_data";
}

export function ShoppingList({
  items,
  listFilter,
  priceHistory,
  onFilterChange,
  onToggleItem,
  onAddItemClick,
  onClearChecked,
  onUncheckAll,
}: ShoppingListProps) {
  const visibleList =
    listFilter === "All"
      ? items
      : items.filter((i) => (listFilter === "Household" ? i.category === "Household" : i.category !== "Household"));

  // Consolidate duplicate ingredients
  const consolidatedItems = consolidateIngredients(visibleList);

  const grouped = consolidatedItems.reduce(
    (acc, item) => {
      const c = item.category || "Other";
      (acc[c] = acc[c] || []).push(item);
      return acc;
    },
    {} as Record<string, ConsolidatedItem[]>
  );

  const remaining = items.filter((i) => !i.checked).length;
  const estTotal = items.filter((i) => i.estimatedCost != null).reduce((s, i) => s + (i.estimatedCost || 0), 0);

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ padding: "16px 24px" }}>
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <div>
          <div className="font-bold" style={{ fontFamily: "var(--font-lora), serif", fontSize: "clamp(14px, 4vw, 18px)" }}>
            Shopping List
          </div>
          {items.length > 0 && (
            <div style={{ color: T.muted, fontSize: "clamp(9px, 2.2vw, 12px)" }}>
              {remaining} of {items.length} left
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={onUncheckAll}
              className="cursor-pointer rounded-full border font-semibold"
              style={{ borderColor: T.border, background: T.card, color: T.muted, padding: "4px 10px", fontSize: "clamp(9px, 2.2vw, 11px)" }}
            >
              Reset
            </button>
            <button
              onClick={onClearChecked}
              className="cursor-pointer rounded-full border-none font-bold"
              style={{ background: T.butterL, color: T.butterD, padding: "4px 10px", fontSize: "clamp(9px, 2.2vw, 11px)" }}
            >
              Clear ✓
            </button>
          </div>
        )}
      </div>

      <div className="mb-2 flex shrink-0 flex-wrap gap-1">
        {(["All", "Food", "Household"] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className="cursor-pointer rounded-full border font-bold"
            style={{
              background: listFilter === f ? (f === "Household" ? T.household : T.butter) : T.card,
              color: listFilter === f ? "#fff" : T.muted,
              borderColor: listFilter === f ? (f === "Household" ? T.household : T.butter) : T.border,
              padding: "4px 10px",
              fontSize: "clamp(9px, 2.2vw, 11px)",
            }}
          >
            {f === "Household" ? "🏠" : f === "Food" ? "🥦" : "All"}
          </button>
        ))}
        <button
          onClick={onAddItemClick}
          className="ml-auto cursor-pointer rounded-full border font-bold"
          style={{ background: T.householdL, color: T.household, borderColor: `${T.household}40`, padding: "4px 10px", fontSize: "clamp(9px, 2.2vw, 11px)" }}
        >
          + Add
        </button>
      </div>

      {visibleList.length === 0 ? (
        <div className="px-5 py-12 text-center" style={{ color: T.muted }}>
          <div className="mb-3 text-5xl">{listFilter === "Household" ? "🏠" : "🛒"}</div>
          <div className="mb-1.5 text-base" style={{ fontFamily: "var(--font-lora), serif", color: T.brown }}>
            {listFilter === "Household" ? "No household items" : "Nothing here yet"}
          </div>
          <div className="text-[12.5px] leading-loose">
            {listFilter === "Household" ? 'Tap "+ Add Item" above.' : "Tap 🧈 and tell Butter what to cook."}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pb-16">
          {Object.entries(grouped).map(([cat, categoryItems]) => (
            <div key={cat} className="mb-3">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="font-extrabold uppercase tracking-wide"
                  style={{ color: cat === "Household" ? T.household : T.green, fontSize: "clamp(8px, 2vw, 10px)" }}
                >
                  {cat === "Household" ? "🏠 " + cat : cat}
                </span>
                <div className="h-px flex-1" style={{ background: cat === "Household" ? T.householdL : T.greenL }} />
                <span className="font-semibold" style={{ color: T.muted, fontSize: "clamp(8px, 2vw, 10px)" }}>
                  {categoryItems.length}
                </span>
              </div>
              {categoryItems.map((item) => {
                const best = getBestStore(item.ingredient, priceHistory);
                // For consolidated items, toggle all originals
                const handleToggle = () => {
                  item.originalIds.forEach((id) => onToggleItem(id));
                };
                return (
                  <div
                    key={item.id}
                    onClick={handleToggle}
                    className="mb-2 flex cursor-pointer items-start gap-3 rounded-2xl transition-colors"
                    style={{
                      background: item.checked ? "#F5F0E8" : T.card,
                      border: `1.5px solid ${T.border}`,
                      boxShadow: item.checked ? "none" : "0 2px 8px rgba(0,0,0,0.08)",
                      opacity: item.checked ? 0.5 : 1,
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      className="mt-0.5 flex shrink-0 items-center justify-center rounded-md border-2 transition-all"
                      style={{
                        width: "clamp(18px, 4.5vw, 22px)",
                        height: "clamp(18px, 4.5vw, 22px)",
                        borderColor: item.checked ? T.green : T.border,
                        background: item.checked ? T.green : "transparent",
                      }}
                    >
                      {item.checked && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <polyline
                            points="2,6 5,9 10,3"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span
                          className="font-bold"
                          style={{
                            textDecoration: item.checked ? "line-through" : "none",
                            color: item.checked ? T.muted : T.brown,
                            fontSize: "clamp(11px, 2.8vw, 13px)",
                          }}
                        >
                          {item.ingredient}
                        </span>
                        <span style={{ color: T.muted, fontSize: "clamp(9px, 2.2vw, 11px)" }}>
                          {item.totalQuantity}
                          {item.unit ? ` ${item.unit}` : ""}
                        </span>
                        {item.meals.length > 1 && (
                          <span
                            className="rounded-full px-1.5 py-0.5 font-bold"
                            style={{ background: T.butterL, color: T.butterD, fontSize: "clamp(7px, 1.8vw, 9px)" }}
                          >
                            {item.meals.length} meals
                          </span>
                        )}
                      </div>
                      {item.category !== "Household" && item.meals.length === 1 && item.meals[0] && (
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold"
                          style={{ color: T.terra, fontSize: "clamp(8px, 2vw, 10px)" }}
                        >
                          🍽 {item.meals[0]}
                        </div>
                      )}
                      {best && best !== "no_data" && (
                        <div className="font-bold" style={{ color: T.green, fontSize: "clamp(8px, 2vw, 10px)" }}>
                          🏷 Best at {best.store} · ${best.avg.toFixed(2)}
                        </div>
                      )}
                      {best === "no_data" && item.category !== "Household" && (
                        <div style={{ color: T.muted, fontSize: "clamp(7px, 1.8vw, 9px)" }}>
                          No price data
                        </div>
                      )}
                    </div>
                    {item.estimatedCost != null && (
                      <div
                        className="shrink-0 rounded-md px-1.5 py-0.5 font-extrabold"
                        style={{ background: T.greenL, color: T.green, fontSize: "clamp(9px, 2.2vw, 11px)" }}
                      >
                        ${item.estimatedCost.toFixed(2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {items.some((i) => i.estimatedCost != null) && (
            <div
              className="mb-2 flex items-center justify-between rounded-2xl border p-3"
              style={{
                background: "linear-gradient(135deg,#FDF3D8,#FFF9EE)",
                borderColor: "#EDD98A",
                boxShadow: "0 4px 14px rgba(212,146,10,0.15)",
              }}
            >
              <div>
                <div className="text-xs font-bold" style={{ color: T.butterD }}>
                  🧈 Estimated Total
                </div>
                <div className="mt-0.5 text-[10.5px]" style={{ color: T.muted }}>
                  From scanned receipts
                </div>
              </div>
              <div className="text-xl font-bold" style={{ fontFamily: "var(--font-lora), serif", color: T.butterD }}>
                ${estTotal.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
