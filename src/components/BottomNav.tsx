"use client";

import { T } from "@/lib/constants";

type TabType = "plan" | "list" | "receipt" | "prices";

interface BottomNavProps {
  tab: TabType;
  onTabChange: (tab: TabType) => void;
  listCount: number;
}

const CalIcon = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? T.butter : T.muted}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ListIcon = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? T.butter : T.muted}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

const ReceiptIcon = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? T.butter : T.muted}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2z" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
  </svg>
);

const ChartIcon = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? T.butter : T.muted}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const TABS: { id: TabType; label: string; Icon: typeof CalIcon }[] = [
  { id: "plan", label: "Plan", Icon: CalIcon },
  { id: "list", label: "List", Icon: ListIcon },
  { id: "receipt", label: "Receipt", Icon: ReceiptIcon },
  { id: "prices", label: "Prices", Icon: ChartIcon },
];

export function BottomNav({ tab, onTabChange, listCount }: BottomNavProps) {
  return (
    <div
      className="relative z-[100] flex h-16 shrink-0 border-t"
      style={{
        background: T.card,
        borderTopColor: T.border,
        boxShadow: "0 -4px 20px rgba(30,18,8,0.07)",
      }}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent pb-2 pt-2.5"
        >
          <div
            className="transition-transform duration-150"
            style={{ transform: tab === t.id ? "scale(1.12)" : "scale(1)" }}
          >
            <t.Icon active={tab === t.id} />
          </div>
          <span
            className="text-[10px]"
            style={{
              fontWeight: tab === t.id ? 800 : 500,
              color: tab === t.id ? T.butter : T.muted,
            }}
          >
            {t.id === "list" && listCount > 0 ? `List (${listCount})` : t.label}
          </span>
          {tab === t.id && (
            <div className="h-1 w-1 rounded-full" style={{ background: T.butter }} />
          )}
        </button>
      ))}
    </div>
  );
}
