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
}: ReceiptScannerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [store, setStore] = useState("Aldi");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!files.length || loading) return;

    for (const file of files) {
      const base64 = await fileToBase64(file);
      const result = await onAnalyze(base64, file.type, store);
      if (result) {
        onReceiptAnalyzed({
          store: result.store || store,
          date: result.date,
          total: result.total,
          items: result.items,
          butterQuip: result.butterQuip,
        });
      }
    }
    setFiles([]);
  };

  return (
    <div className="px-3.5 pb-28 pt-3.5">
      <div className="mb-1 text-lg font-bold" style={{ fontFamily: "var(--font-lora), serif" }}>
        Scan Receipt
      </div>
      <div className="mb-3.5 text-[12.5px]" style={{ color: T.muted }}>
        Butter reads receipts and tracks prices by store.
      </div>

      <div
        className="mb-3 flex items-center gap-2.5 rounded-[14px] border px-3.5 py-3"
        style={{ background: T.card, borderColor: T.border, boxShadow: T.shadow }}
      >
        <span className="whitespace-nowrap text-[13px] font-semibold" style={{ color: T.brown }}>
          🏪 Store
        </span>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="flex-1 cursor-pointer border-none bg-transparent text-[13px] font-bold outline-none"
          style={{ color: T.butterD }}
        >
          {STORES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className="mb-3 cursor-pointer rounded-[20px] border-2 border-dashed p-8 text-center transition-colors active:border-[#D4920A] active:bg-[#FEF6E0]"
        style={{ borderColor: T.border, background: T.card, boxShadow: T.shadow }}
      >
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
          style={{ background: T.butterL, boxShadow: "0 3px 12px rgba(212,146,10,0.2)" }}
        >
          📸
        </div>
        <div className="mb-1 text-sm font-bold" style={{ color: T.brown }}>
          Tap to upload receipt photo
        </div>
        <div className="text-xs" style={{ color: T.muted }}>
          JPG · PNG · HEIC · Multiple OK
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </div>

      {files.length > 0 && (
        <div className="mb-3.5">
          <div className="mb-2 text-xs" style={{ color: T.muted }}>
            📎 {files.length} photo{files.length > 1 ? "s" : ""} ready · Logging as <strong>{store}</strong>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full cursor-pointer rounded-[14px] border-none px-4 py-3.5 text-sm font-extrabold"
            style={{
              background: loading ? T.muted : T.butter,
              color: loading ? "#fff" : T.brown,
              boxShadow: loading ? "none" : "0 4px 16px rgba(212,146,10,0.4)",
            }}
          >
            {loading ? `🧈 ${loadLabel}` : "✦ Analyze & Log Prices"}
          </button>
        </div>
      )}

      {receipts.map((r) => (
        <div
          key={r._id}
          className="mb-3 rounded-[18px] border p-4 animate-in fade-in slide-in-from-bottom-2"
          style={{ background: T.card, borderColor: T.border, boxShadow: T.shadow }}
        >
          <div className="mb-2.5 flex items-start justify-between">
            <div>
              <div className="text-sm font-bold">{r.store}</div>
              <div className="mt-0.5 text-[11.5px]" style={{ color: T.muted }}>
                {r.date || "Recent"}
              </div>
            </div>
            {r.total != null && (
              <div className="text-[17px] font-bold" style={{ fontFamily: "var(--font-lora), serif", color: T.green }}>
                ${r.total.toFixed(2)}
              </div>
            )}
          </div>
          {(r.items || []).map((item, i) => (
            <div
              key={i}
              className="flex justify-between border-t py-2"
              style={{ borderTopColor: T.border }}
            >
              <span className="text-[13px]">{item.name}</span>
              <span className="text-[13px] font-bold" style={{ color: T.terra }}>
                ${item.price?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
