"use client";

import { useState } from "react";
import { T } from "@/lib/constants";

interface PriceEntry {
  ingredientKey: string;
  displayName: string;
  entries: Array<{ date: string; price: number; store: string }>;
}

interface Receipt {
  _id: string;
  store: string;
  date: string;
  total: number;
  items: Array<{ name: string; price: number }>;
}

interface PriceTrackerProps {
  priceHistory: PriceEntry[];
  receipts?: Receipt[];
}

export function PriceTracker({ priceHistory, receipts = [] }: PriceTrackerProps) {
  const [view, setView] = useState<"spending" | "prices">("spending");


  // Calculate spending stats
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonthNum = now.getMonth(); // 0-indexed

  // Helper to parse date string and check if it's in a given month
  // Handles YYYY-MM-DD format properly without timezone issues
  const isInMonth = (dateStr: string | undefined, year: number, month: number) => {
    if (!dateStr) return false;
    // Parse YYYY-MM-DD directly to avoid timezone issues
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const dateYear = parseInt(parts[0], 10);
      const dateMonth = parseInt(parts[1], 10) - 1; // Convert to 0-indexed
      return dateYear === year && dateMonth === month;
    }
    // Fallback for other formats
    const d = new Date(dateStr + "T12:00:00"); // Add noon time to avoid timezone shifts
    return d.getFullYear() === year && d.getMonth() === month;
  };

  const thisMonthReceipts = receipts.filter((r) => isInMonth(r.date, thisYear, thisMonthNum));
  const lastMonthReceipts = receipts.filter((r) => {
    const lastM = thisMonthNum === 0 ? 11 : thisMonthNum - 1;
    const lastY = thisMonthNum === 0 ? thisYear - 1 : thisYear;
    return isInMonth(r.date, lastY, lastM);
  });

  const thisMonthTotal = thisMonthReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const lastMonthTotal = lastMonthReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const allTimeTotal = receipts.reduce((sum, r) => sum + (r.total || 0), 0);

  // Calculate weekly average based on actual dates
  const parseDate = (dateStr: string) => {
    // Parse YYYY-MM-DD safely
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
    }
    return new Date(dateStr + "T12:00:00").getTime();
  };

  const validReceipts = receipts.filter((r) => r.date && r.total);
  let weeklyAvg = 0;
  if (validReceipts.length > 0) {
    const dates = validReceipts.map((r) => parseDate(r.date!));
    const firstDate = Math.min(...dates);
    const lastDate = Math.max(...dates);
    const daySpan = Math.max(7, (lastDate - firstDate) / (24 * 60 * 60 * 1000));
    const weeks = daySpan / 7;
    weeklyAvg = allTimeTotal / weeks;
  }

  // By store breakdown
  const byStore: Record<string, number> = {};
  receipts.forEach((r) => {
    byStore[r.store] = (byStore[r.store] || 0) + (r.total || 0);
  });
  const storeList = Object.entries(byStore).sort((a, b) => b[1] - a[1]);
  const maxStore = storeList[0]?.[1] || 1;

  if (priceHistory.length === 0 && receipts.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden" style={{ padding: "16px 24px" }}>
        <div className="mb-1 font-bold" style={{ fontFamily: "var(--font-lora), serif", fontSize: "clamp(14px, 4vw, 18px)" }}>
          Spending & Prices
        </div>
        <div className="mb-2" style={{ color: T.muted, fontSize: "clamp(10px, 2.5vw, 13px)" }}>
          Track grocery spending and price trends.
        </div>
        <div className="px-5 py-12 text-center" style={{ color: T.muted }}>
          <div className="mb-3 text-5xl">📊</div>
          <div className="mb-1.5 text-base" style={{ fontFamily: "var(--font-lora), serif", color: T.brown }}>
            Nothing tracked yet
          </div>
          <div className="text-[12.5px] leading-loose">
            Scan receipts and Butter will track
            <br />
            your spending and prices.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ padding: "16px 24px" }}>
      <div className="mb-1 shrink-0 font-bold" style={{ fontFamily: "var(--font-lora), serif", fontSize: "clamp(14px, 4vw, 18px)" }}>
        Spending & Prices
      </div>

      {/* View toggle */}
      <div className="mb-2 flex shrink-0 gap-1.5">
        {(["spending", "prices"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="cursor-pointer rounded-full border font-bold capitalize"
            style={{
              background: view === v ? T.terra : T.card,
              color: view === v ? "#fff" : T.muted,
              borderColor: view === v ? T.terra : T.border,
              padding: "4px 12px",
              fontSize: "clamp(9px, 2.2vw, 11px)",
            }}
          >
            {v === "spending" ? "💰 Spending" : "📊 Prices"}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        {view === "spending" && (
          <>
            {/* Spending summary cards */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl" style={{ background: T.card, border: `1.5px solid ${T.border}`, padding: "14px 16px" }}>
                <div className="text-[9px] font-bold uppercase" style={{ color: T.muted }}>This Month</div>
                <div className="text-xl font-extrabold" style={{ color: T.green }}>${thisMonthTotal.toFixed(2)}</div>
                <div className="text-[10px]" style={{ color: T.muted }}>{thisMonthReceipts.length} trips</div>
              </div>
              <div className="rounded-2xl" style={{ background: T.card, border: `1.5px solid ${T.border}`, padding: "14px 16px" }}>
                <div className="text-[9px] font-bold uppercase" style={{ color: T.muted }}>Weekly Avg</div>
                <div className="text-xl font-extrabold" style={{ color: T.butter }}>${weeklyAvg.toFixed(2)}</div>
                <div className="text-[10px]" style={{ color: T.muted }}>per week</div>
              </div>
            </div>

            {lastMonthTotal > 0 && (
              <div className="mb-3 rounded-2xl" style={{ background: T.bg, border: `1.5px solid ${T.border}`, padding: "14px 16px" }}>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold" style={{ color: T.muted }}>Last Month</span>
                  <span className="text-sm font-bold" style={{ color: T.brown }}>${lastMonthTotal.toFixed(2)}</span>
                </div>
                {thisMonthTotal !== lastMonthTotal && (
                  <div className="mt-1 text-[10px] font-bold" style={{ color: thisMonthTotal < lastMonthTotal ? T.green : T.terra }}>
                    {thisMonthTotal < lastMonthTotal ? "↓" : "↑"} ${Math.abs(thisMonthTotal - lastMonthTotal).toFixed(2)} vs last month
                  </div>
                )}
              </div>
            )}

            {/* By store */}
            {storeList.length > 0 && (
              <div className="mb-3 rounded-2xl" style={{ background: T.card, border: `1.5px solid ${T.border}`, padding: "14px 16px" }}>
                <div className="mb-2 text-[10px] font-bold uppercase" style={{ color: T.muted }}>By Store</div>
                {storeList.map(([store, total]) => (
                  <div key={store} className="mb-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold" style={{ color: T.brown }}>{store}</span>
                      <span className="font-bold" style={{ color: T.green }}>${total.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: T.bg }}>
                      <div className="h-full rounded-full" style={{ width: `${(total / maxStore) * 100}%`, background: T.butter }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All time */}
            <div className="rounded-2xl text-center" style={{ background: T.terraL, border: `1.5px solid ${T.terra}`, padding: "14px 16px" }}>
              <div className="text-[9px] font-bold uppercase" style={{ color: T.terra }}>All Time Total</div>
              <div className="text-2xl font-extrabold" style={{ color: T.terra }}>${allTimeTotal.toFixed(2)}</div>
              <div className="text-[10px]" style={{ color: T.muted }}>{receipts.length} receipts scanned</div>
            </div>
          </>
        )}

        {view === "prices" && priceHistory.length > 0 && (
          <>
            {priceHistory
        .sort((a, b) => a.ingredientKey.localeCompare(b.ingredientKey))
        .map((item) => {
          const prices = item.entries.map((e) => e.price).filter(Boolean);
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length || 0;
          const lo = Math.min(...prices) || 0;
          const hi = Math.max(...prices) || 0;

          const storeMap: Record<string, { total: number; count: number }> = {};
          item.entries.forEach((e) => {
            if (!storeMap[e.store]) storeMap[e.store] = { total: 0, count: 0 };
            storeMap[e.store].total += e.price;
            storeMap[e.store].count++;
          });

          const storeAvgs = Object.entries(storeMap)
            .map(([store, { total, count }]) => ({ store, avg: total / count }))
            .sort((a, b) => a.avg - b.avg);

          return (
            <div
              key={item.ingredientKey}
              className="mb-3 rounded-2xl animate-in fade-in slide-in-from-bottom-2"
              style={{ background: T.card, border: `1.5px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "16px" }}
            >
              <div className="mb-2.5 flex items-start justify-between">
                <div className="flex-1 text-sm font-bold capitalize">{item.displayName || item.ingredientKey}</div>
                <div className="flex gap-1">
                  {[
                    { label: "avg", value: avg, color: T.butterD },
                    { label: "lo", value: lo, color: T.green },
                    { label: "hi", value: hi, color: T.terra },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg px-2 py-0.5 text-center" style={{ background: T.bg }}>
                      <div
                        className="text-[7px] font-bold uppercase tracking-wide"
                        style={{ color: T.muted, letterSpacing: 0.4 }}
                      >
                        {label}
                      </div>
                      <div className="text-[11.5px] font-extrabold" style={{ color }}>
                        ${value.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {storeAvgs.length > 1 && (
                <div
                  className="mb-2.5 rounded-lg px-2.5 py-2 text-[11.5px] font-bold"
                  style={{ background: T.greenL, color: T.green }}
                >
                  🏆 Best at {storeAvgs[0].store} · avg ${storeAvgs[0].avg.toFixed(2)}
                </div>
              )}

              {storeAvgs.map((s, i) => (
                <div
                  key={s.store}
                  className="flex items-center gap-2 py-1.5"
                  style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}
                >
                  <span className="min-w-[86px] text-[11.5px] font-semibold" style={{ color: T.muted }}>
                    {s.store}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: T.bg }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.avg / hi) * 100}%`,
                        background: i === 0 ? T.green : T.border,
                      }}
                    />
                  </div>
                  <span
                    className="min-w-10 text-right text-xs font-extrabold"
                    style={{ color: i === 0 ? T.green : T.terra }}
                  >
                    ${s.avg.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
          </>
        )}

        {view === "prices" && priceHistory.length === 0 && (
          <div className="px-5 py-8 text-center" style={{ color: T.muted }}>
            <div className="mb-2 text-3xl">📊</div>
            <div className="text-sm">No price data yet</div>
            <div className="text-xs">Scan receipts to track prices</div>
          </div>
        )}
      </div>
    </div>
  );
}
