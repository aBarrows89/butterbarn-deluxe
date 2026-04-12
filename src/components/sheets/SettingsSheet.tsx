"use client";

import { useState, useEffect } from "react";
import { T } from "@/lib/constants";
import {
  requestNotificationPermission,
  checkNotificationPermission,
  scheduleMealReminder,
  scheduleShoppingReminder,
} from "@/lib/notifications";

interface Substitution {
  original: string;
  replacement: string;
}

interface Preferences {
  dislikes: string[];
  allergies: string[];
  avoidMeals: string[];
  substitutions?: Substitution[];
}

interface SettingsSheetProps {
  preferences: Preferences;
  onAddDislike: (item: string) => void;
  onRemoveDislike: (item: string) => void;
  onAddAllergy: (item: string) => void;
  onRemoveAllergy: (item: string) => void;
  onAddSubstitution: (original: string, replacement: string) => void;
  onRemoveSubstitution: (original: string) => void;
  onClose: () => void;
}

export function SettingsSheet({
  preferences,
  onAddDislike,
  onRemoveDislike,
  onAddAllergy,
  onRemoveAllergy,
  onAddSubstitution,
  onRemoveSubstitution,
  onClose,
}: SettingsSheetProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [mealReminder, setMealReminder] = useState(false);
  const [shoppingReminder, setShoppingReminder] = useState(false);
  const [loading, setLoading] = useState(true);

  // Input states for adding new items
  const [newDislike, setNewDislike] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newSubOriginal, setNewSubOriginal] = useState("");
  const [newSubReplacement, setNewSubReplacement] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("butterSettings");
    if (saved) {
      const settings = JSON.parse(saved);
      setMealReminder(settings.mealReminder ?? false);
      setShoppingReminder(settings.shoppingReminder ?? false);
    }

    checkNotificationPermission().then((granted) => {
      setHasPermission(granted);
      setLoading(false);
    });
  }, []);

  const saveSettings = (meal: boolean, shopping: boolean) => {
    localStorage.setItem("butterSettings", JSON.stringify({ mealReminder: meal, shoppingReminder: shopping }));
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
  };

  const handleMealReminderToggle = async () => {
    const newValue = !mealReminder;
    setMealReminder(newValue);
    saveSettings(newValue, shoppingReminder);
    await scheduleMealReminder(newValue, 17);
  };

  const handleShoppingReminderToggle = async () => {
    const newValue = !shoppingReminder;
    setShoppingReminder(newValue);
    saveSettings(mealReminder, newValue);
    await scheduleShoppingReminder(newValue, 6, 10);
  };

  const handleAddDislike = () => {
    if (newDislike.trim()) {
      onAddDislike(newDislike.trim());
      setNewDislike("");
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      onAddAllergy(newAllergy.trim());
      setNewAllergy("");
    }
  };

  const handleAddSubstitution = () => {
    if (newSubOriginal.trim() && newSubReplacement.trim()) {
      onAddSubstitution(newSubOriginal.trim(), newSubReplacement.trim());
      setNewSubOriginal("");
      setNewSubReplacement("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[85vh] w-full max-w-md animate-in zoom-in-95 overflow-y-auto rounded-3xl"
        style={{ background: T.bg, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: "24px 28px 40px 28px" }}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full" style={{ background: T.border }} />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-lora), serif", color: T.brown }}>
            Settings
          </h2>
          <button onClick={onClose} className="cursor-pointer border-none bg-transparent text-2xl font-bold" style={{ color: T.muted }}>
            ×
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center" style={{ color: T.muted }}>
            Loading...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dietary Restrictions / Allergies */}
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: T.terra }}>
                Allergies
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {preferences.allergies.length === 0 && (
                  <span className="text-xs" style={{ color: T.muted }}>None added</span>
                )}
                {preferences.allergies.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: T.terraL, color: T.terra }}
                  >
                    {item}
                    <button
                      onClick={() => onRemoveAllergy(item)}
                      className="cursor-pointer border-none bg-transparent font-bold"
                      style={{ color: T.terra }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAllergy()}
                  placeholder="Add allergy..."
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: T.border, background: T.card }}
                />
                <button
                  onClick={handleAddAllergy}
                  className="cursor-pointer rounded-lg border-none px-3 py-2 text-sm font-bold"
                  style={{ background: T.terra, color: "#fff" }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Dislikes */}
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: T.butterD }}>
                Dislikes
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {preferences.dislikes.length === 0 && (
                  <span className="text-xs" style={{ color: T.muted }}>None added</span>
                )}
                {preferences.dislikes.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: T.butterL, color: T.butterD }}
                  >
                    {item}
                    <button
                      onClick={() => onRemoveDislike(item)}
                      className="cursor-pointer border-none bg-transparent font-bold"
                      style={{ color: T.butterD }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDislike}
                  onChange={(e) => setNewDislike(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDislike()}
                  placeholder="Add dislike..."
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: T.border, background: T.card }}
                />
                <button
                  onClick={handleAddDislike}
                  className="cursor-pointer rounded-lg border-none px-3 py-2 text-sm font-bold"
                  style={{ background: T.butter, color: "#fff" }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Substitutions */}
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: T.green }}>
                Substitutions
              </div>
              <div className="mb-2 space-y-1.5">
                {(!preferences.substitutions || preferences.substitutions.length === 0) && (
                  <span className="text-xs" style={{ color: T.muted }}>None added</span>
                )}
                {preferences.substitutions?.map((sub) => (
                  <div
                    key={sub.original}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: T.greenL }}
                  >
                    <span className="text-xs font-semibold" style={{ color: T.green }}>
                      {sub.original} → {sub.replacement}
                    </span>
                    <button
                      onClick={() => onRemoveSubstitution(sub.original)}
                      className="cursor-pointer border-none bg-transparent font-bold"
                      style={{ color: T.green }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubOriginal}
                  onChange={(e) => setNewSubOriginal(e.target.value)}
                  placeholder="Replace..."
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: T.border, background: T.card }}
                />
                <span className="self-center text-sm" style={{ color: T.muted }}>→</span>
                <input
                  type="text"
                  value={newSubReplacement}
                  onChange={(e) => setNewSubReplacement(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubstitution()}
                  placeholder="With..."
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: T.border, background: T.card }}
                />
              </div>
              <button
                onClick={handleAddSubstitution}
                disabled={!newSubOriginal.trim() || !newSubReplacement.trim()}
                className="mt-2 w-full cursor-pointer rounded-lg border-none py-2 text-sm font-bold disabled:opacity-50"
                style={{ background: T.green, color: "#fff" }}
              >
                Add Substitution
              </button>
            </div>

            {/* Notifications section */}
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: T.muted }}>
                Reminders
              </div>

              {!hasPermission ? (
                <button
                  onClick={handleRequestPermission}
                  className="w-full cursor-pointer rounded-xl border px-4 py-3 text-left font-semibold"
                  style={{ background: T.butterL, borderColor: T.butter, color: T.butterD }}
                >
                  <div className="flex items-center justify-between">
                    <span>Enable Notifications</span>
                    <span>🔔</span>
                  </div>
                  <div className="mt-1 text-xs" style={{ color: T.muted }}>
                    Allow Butter to send reminders
                  </div>
                </button>
              ) : (
                <div className="space-y-2">
                  <div
                    className="flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3"
                    style={{ background: T.card, borderColor: T.border }}
                    onClick={handleMealReminderToggle}
                  >
                    <div>
                      <div className="font-semibold" style={{ color: T.brown }}>
                        Daily Dinner Reminder
                      </div>
                      <div className="text-xs" style={{ color: T.muted }}>
                        5:00 PM every day
                      </div>
                    </div>
                    <div
                      className="flex h-6 w-11 items-center rounded-full px-0.5 transition-colors"
                      style={{ background: mealReminder ? T.green : T.border }}
                    >
                      <div
                        className="h-5 w-5 rounded-full bg-white shadow transition-transform"
                        style={{ transform: mealReminder ? "translateX(20px)" : "translateX(0)" }}
                      />
                    </div>
                  </div>

                  <div
                    className="flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3"
                    style={{ background: T.card, borderColor: T.border }}
                    onClick={handleShoppingReminderToggle}
                  >
                    <div>
                      <div className="font-semibold" style={{ color: T.brown }}>
                        Weekly Shopping Reminder
                      </div>
                      <div className="text-xs" style={{ color: T.muted }}>
                        Saturday at 10:00 AM
                      </div>
                    </div>
                    <div
                      className="flex h-6 w-11 items-center rounded-full px-0.5 transition-colors"
                      style={{ background: shoppingReminder ? T.green : T.border }}
                    >
                      <div
                        className="h-5 w-5 rounded-full bg-white shadow transition-transform"
                        style={{ transform: shoppingReminder ? "translateX(20px)" : "translateX(0)" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 text-center text-xs" style={{ color: T.muted }}>
              Made with ❤️ for the best wifey ever
              <br />
              <span style={{ fontSize: "10px" }}>Love, Andy</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
