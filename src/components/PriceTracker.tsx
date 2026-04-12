"use client";

import { T } from "@/lib/constants";

interface PriceEntry {
  ingredientKey: string;
  displayName: string;
  entries: Array<{ date: string; price: number; store: string }>;
}

interface PriceTrackerProps {
  priceHistory: PriceEntry[];
}

export function PriceTracker({ priceHistory }: PriceTrackerProps) {
  if (priceHistory.length === 0) {
    return (
      <div className="px-3.5 pb-28 pt-3.5">
        <div className="mb-1 text-lg font-bold" style={{ fontFamily: "var(--font-lora), serif" }}>
          Price Tracker
        </div>
        <div className="mb-3.5 text-[12.5px]" style={{ color: T.muted }}>
          Prices tracked per store so you always know the best deal.
        </div>
        <div className="px-5 py-12 text-center" style={{ color: T.muted }}>
          <div className="mb-3 text-5xl">📊</div>
          <div className="mb-1.5 text-base" style={{ fontFamily: "var(--font-lora), serif", color: T.brown }}>
            Nothing tracked yet
          </div>
          <div className="text-[13px] leading-loose">
            Scan receipts and Butter will track
            <br />
            prices across Aldi, Giant Eagle, and more.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3.5 pb-28 pt-3.5">
      <div className="mb-1 text-lg font-bold" style={{ fontFamily: "var(--font-lora), serif" }}>
        Price Tracker
      </div>
      <div className="mb-3.5 text-[12.5px]" style={{ color: T.muted }}>
        Prices tracked per store so you always know the best deal.
      </div>

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
              className="mb-3 rounded-[18px] border p-4 animate-in fade-in slide-in-from-bottom-2"
              style={{ background: T.card, borderColor: T.border, boxShadow: T.shadow }}
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
    </div>
  );
}
