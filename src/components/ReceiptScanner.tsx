"use client";

import { useState, useRef } from "react";
import { T, STORES } from "@/lib/constants";

interface ReceiptItem {
  name: string;
  price: number;
  quantity?: string;
  unit?: string;
}

interface Receipt {
  _id: string;
  store: string;
  date: string;
  total: number;
  items: ReceiptItem[];
}

interface ReceiptScannerProps {
  receipts: Receipt[];
  loading: boolean;
  loadLabel: string;
  onAnalyze: (imageBase64: string, mediaType: string, store: string) => Promise<{
    butterQuip: string;
    store: string;
    date: string;
    items: ReceiptItem[];
    total: number;
  } | null>;
  onReceiptAnalyzed: (data: {
    store: string;
    date: string;
    total: number;
    items: ReceiptItem[];
    butterQuip: string;
  }) => void;
  onDeleteReceipt: (id: string) => void;
}

function fileToBase64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export function ReceiptScanner({
  receipts,
  loading,
  loadLabel,
  onAnalyze,
  onReceiptAnalyzed,
  onDeleteReceipt,
}: ReceiptScannerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [store, setStore] = useState("Aldi");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!files.length || loading) return;

    // Collect all items from all photos
    const allItems: ReceiptItem[] = [];
    let latestDate = "";
    let maxTotal = 0;
    let lastQuip = "";

    for (const file of files) {
      const base64 = await fileToBase64(file);
      const result = await onAnalyze(base64, file.type, store);
      if (result) {
        // Merge items, dedupe by name+price
        for (const item of result.items) {
          const key = `${item.name.toLowerCase()}|${item.price}`;
          const exists = allItems.some(
            (i) => `${i.name.toLowerCase()}|${i.price}` === key
          );
          if (!exists) {
            allItems.push(item);
          }
        }
        // Use latest date and highest total
        if (result.date > latestDate) latestDate = result.date;
        if (result.total > maxTotal) maxTotal = result.total;
        if (result.butterQuip) lastQuip = result.butterQuip;
      }
    }

    // Save as single merged receipt
    if (allItems.length > 0) {
      onReceiptAnalyzed({
        store,
        date: latestDate,
        total: maxTotal,
        items: allItems,
        butterQuip: lastQuip || `Got ${allItems.length} items from your receipt!`,
      });
    }

    setFiles([]);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ padding: "16px 24px" }}>
      <div className="mb-1 font-bold" style={{ fontFamily: "var(--font-lora), serif", fontSize: "clamp(14px, 4vw, 18px)" }}>
        Scan Receipt
      </div>
      <div className="mb-2" style={{ color: T.muted, fontSize: "clamp(10px, 2.5vw, 13px)" }}>
        Butter reads receipts and tracks prices.
      </div>

      <div
        className="mb-3 flex shrink-0 items-center gap-2 rounded-2xl"
        style={{ background: T.card, border: `1.5px solid ${T.border}`, padding: "12px 16px" }}
      >
        <span className="whitespace-nowrap font-semibold" style={{ color: T.brown, fontSize: "clamp(11px, 2.5vw, 14px)" }}>
          🏪
        </span>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="flex-1 cursor-pointer border-none bg-transparent font-bold outline-none"
          style={{ color: T.butterD, fontSize: "clamp(11px, 2.5vw, 14px)" }}
        >
          {STORES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className="mb-2 shrink-0 cursor-pointer rounded-2xl border-2 border-dashed text-center transition-colors active:border-[#D4920A] active:bg-[#FEF6E0]"
        style={{ borderColor: T.border, background: T.card, padding: "clamp(16px, 4vh, 32px)" }}
      >
        <div
          className="mx-auto mb-2 flex items-center justify-center rounded-xl"
          style={{
            background: T.butterL,
            boxShadow: "0 3px 12px rgba(212,146,10,0.2)",
            width: "clamp(40px, 10vw, 56px)",
            height: "clamp(40px, 10vw, 56px)",
            fontSize: "clamp(18px, 5vw, 28px)",
          }}
        >
          📸
        </div>
        <div className="mb-1 font-bold" style={{ color: T.brown, fontSize: "clamp(12px, 3vw, 15px)" }}>
          Tap to capture receipt
        </div>
        <div style={{ color: T.muted, fontSize: "clamp(10px, 2.5vw, 13px)" }}>
          Camera or gallery
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </div>

      {files.length > 0 && (
        <div className="mb-2 shrink-0">
          <div className="mb-1" style={{ color: T.muted, fontSize: "clamp(10px, 2.5vw, 12px)" }}>
            📎 {files.length} photo{files.length > 1 ? "s" : ""} ready
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full cursor-pointer rounded-xl border-none font-extrabold"
            style={{
              background: loading ? T.muted : T.butter,
              color: loading ? "#fff" : T.brown,
              boxShadow: loading ? "none" : "0 4px 16px rgba(212,146,10,0.4)",
              padding: "clamp(10px, 2.5vh, 14px)",
              fontSize: "clamp(12px, 3vw, 15px)",
            }}
          >
            {loading ? `🧈 ${loadLabel}` : "✦ Analyze Receipt"}
          </button>
        </div>
      )}

      {/* Scrollable receipts list */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        {receipts.map((r) => (
          <div
            key={r._id}
            className="mb-3 rounded-2xl animate-in fade-in slide-in-from-bottom-2"
            style={{ background: T.card, border: `1.5px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "14px 16px" }}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <div className="font-bold" style={{ fontSize: "clamp(12px, 3vw, 14px)" }}>{r.store}</div>
                <div style={{ color: T.muted, fontSize: "clamp(10px, 2.5vw, 12px)" }}>
                  {r.date || "Recent"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.total != null && (
                  <div className="font-bold" style={{ fontFamily: "var(--font-lora), serif", color: T.green, fontSize: "clamp(14px, 3.5vw, 17px)" }}>
                    ${r.total.toFixed(2)}
                  </div>
                )}
                <button
                  onClick={() => onDeleteReceipt(r._id)}
                  className="cursor-pointer rounded-lg border-none p-1.5"
                  style={{ background: T.bg, color: T.muted, fontSize: "clamp(12px, 3vw, 14px)" }}
                  title="Delete receipt"
                >
                  ✕
                </button>
              </div>
            </div>
            {(r.items || []).slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="flex justify-between border-t py-1"
                style={{ borderTopColor: T.border, fontSize: "clamp(10px, 2.5vw, 13px)" }}
              >
                <span>{item.name}</span>
                <span className="font-bold" style={{ color: T.terra }}>
                  ${item.price?.toFixed(2)}
                </span>
              </div>
            ))}
            {(r.items || []).length > 3 && (
              <div className="pt-1 text-center" style={{ color: T.muted, fontSize: "clamp(9px, 2vw, 11px)" }}>
                +{r.items.length - 3} more items
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
