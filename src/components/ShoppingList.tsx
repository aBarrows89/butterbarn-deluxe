"use client";

import { T } from "@/lib/constants";

interface ShoppingItem {
  id: string;
  ingredient: string;
  quantity: string;
  unit: string;
  meal: string;
  category: string;
  checked: boolean;
  estimatedCost?: number;
  haveIt?: boolean;
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

function getBestStore(name: string, priceHistory: PriceEntry[]) {
  const key = name.toLowerCase().split(" ")[0];
  const matches = priceHistory.filter((p) => p.ingredientKey.startsWith(key));
  if (!matches.length) return null;

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

  return avgs[0] || null;
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

  const grouped = visibleList.reduce(
    (acc, item) => {
      const c = item.category || "Other";
      (acc[c] = acc[c] || []).push(item);
      return acc;
    },
    {} as Record<string, ShoppingItem[]>
  );

  const remaining = items.filter((i) => !i.checked).length;
  const estTotal = items.filter((i) => i.estimatedCost != null).reduce((s, i) => s + (i.estimatedCost || 0), 0);

  return (
    <div className="px-3.5 pb-28 pt-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold" style={{ fontFamily: "var(--font-lora), serif" }}>
            Shopping List
          </div>
          {items.length > 0 && (
            <div className="mt-0.5 text-[11.5px]" style={{ color: T.muted }}>
              {remaining} of {items.length} remaining
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="flex gap-1.5">
            <button
              onClick={onUncheckAll}
              className="cursor-pointer rounded-full border px-2.5 py-1.5 text-[11.5px] font-semibold"
              style={{ borderColor: T.border, background: T.card, color: T.muted }}
            >
              Reset
            </button>
            <button
              onClick={onClearChecked}
              className="cursor-pointer rounded-full border-none px-2.5 py-1.5 text-[11.5px] font-bold"
              style={{ background: T.butterL, color: T.butterD }}
            >
              Clear ✓
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["All", "Food", "Household"] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold"
            style={{
              background: listFilter === f ? (f === "Household" ? T.household : T.butter) : T.card,
              color: listFilter === f ? "#fff" : T.muted,
              borderColor: listFilter === f ? (f === "Household" ? T.household : T.butter) : T.border,
            }}
          >
            {f === "Household" ? "🏠 Household" : f === "Food" ? "🥦 Food" : "All"}
          </button>
        ))}
        <button
          onClick={onAddItemClick}
          className="ml-auto cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold"
          style={{ background: T.householdL, color: T.household, borderColor: `${T.household}40` }}
        >
          + Add Item
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
        <>
          {Object.entries(grouped).map(([cat, categoryItems]) => (
            <div key={cat} className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest"
                  style={{ color: cat === "Household" ? T.household : T.green }}
                >
                  {cat === "Household" ? "🏠 " + cat : cat}
                </span>
                <div className="h-px flex-1" style={{ background: cat === "Household" ? T.householdL : T.greenL }} />
                <span className="text-[10px] font-semibold" style={{ color: T.muted }}>
                  {categoryItems.length}
                </span>
              </div>
              {categoryItems.map((item) => {
                const best = getBestStore(item.ingredient, priceHistory);
                return (
                  <div
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className="mb-1.5 flex cursor-pointer items-start gap-3 rounded-[15px] border px-3 py-3 transition-colors"
                    style={{
                      background: item.checked ? "#F5F0E8" : T.card,
                      borderColor: T.border,
                      boxShadow: item.checked ? "none" : T.shadow,
                      opacity: item.checked ? 0.5 : 1,
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-[2.5px] transition-all"
                      style={{
                        borderColor: item.checked ? T.green : T.border,
                        background: item.checked ? T.green : "transparent",
                      }}
                    >
                      {item.checked && (
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                          <polyline
                            points="2,6 5,9 10,3"
                            stroke="#fff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span
                          className="text-[13.5px] font-bold"
                          style={{
                            textDecoration: item.checked ? "line-through" : "none",
                            color: item.checked ? T.muted : T.brown,
                          }}
                        >
                          {item.ingredient}
                        </span>
                        <span className="text-[11.5px]" style={{ color: T.muted }}>
                          {item.quantity}
                          {item.unit ? ` ${item.unit}` : ""}
                        </span>
                      </div>
                      {item.category !== "Household" && (
                        <div
                          className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[10.5px] font-semibold"
                          style={{ color: T.terra }}
                        >
                          🍽 {item.meal}
                        </div>
                      )}
                      {best && (
                        <div className="mt-0.5 text-[10px] font-bold" style={{ color: T.green }}>
                          🏷 Best at {best.store} · avg ${best.avg.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {item.estimatedCost != null && (
                      <div
                        className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-extrabold"
                        style={{ background: T.greenL, color: T.green }}
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
              className="flex items-center justify-between rounded-2xl border p-4"
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
              <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-lora), serif", color: T.butterD }}>
                ${estTotal.toFixed(2)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
