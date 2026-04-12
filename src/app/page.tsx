"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getDailyGreeting } from "@/lib/butterGreetings";
import {
  T,
  getCurrentWeekId,
  getWeekOffset,
  initEmptyMeals,
  type DayFull,
  type MealType,
} from "@/lib/constants";
import { useAI } from "@/lib/useAI";
import { Header } from "@/components/Header";
import { ButterQuip } from "@/components/ButterQuip";
import { MealGrid } from "@/components/MealGrid";
import { ShoppingList } from "@/components/ShoppingList";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { PriceTracker } from "@/components/PriceTracker";
import { BottomNav } from "@/components/BottomNav";
import { ChatSheet } from "@/components/sheets/ChatSheet";
import { EditSheet } from "@/components/sheets/EditSheet";
import { MealDetailSheet } from "@/components/sheets/MealDetailSheet";
import { AddItemSheet } from "@/components/sheets/AddItemSheet";
import { DaySheet } from "@/components/sheets/DaySheet";
import { PreviewSheet } from "@/components/sheets/PreviewSheet";

type TabType = "plan" | "list" | "receipt" | "prices";

interface PlanResponse {
  butterQuip: string;
  meals: Record<string, Record<string, string>>;
  nutrition: Record<string, { calories: number; protein: number; carbs: number; fat: number }>;
  shoppingList: Array<{
    ingredient: string;
    quantity: string;
    unit: string;
    meal: string;
    category: string;
  }>;
}

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

export default function ButterBarnDeluxe() {
  const [weekId, setWeekId] = useState(getCurrentWeekId);

  // Convex queries
  const mealPlan = useQuery(api.mealPlans.getByWeek, { weekId });
  const shoppingListData = useQuery(api.shoppingList.getByWeek, { weekId });
  const ratingsData = useQuery(api.ratings.getAllForWeek, { weekId });
  const priceHistoryData = useQuery(api.priceHistory.getAll);
  const receiptsData = useQuery(api.receipts.getRecent, { limit: 10 });
  const preferencesData = useQuery(api.preferences.get);

  // Convex mutations
  const upsertMealPlan = useMutation(api.mealPlans.upsert);
  const updateMeal = useMutation(api.mealPlans.updateMeal);
  const updateSettings = useMutation(api.mealPlans.updateSettings);
  const upsertShoppingList = useMutation(api.shoppingList.upsert);
  const toggleShoppingItem = useMutation(api.shoppingList.toggleItem);
  const addShoppingItem = useMutation(api.shoppingList.addItem);
  const clearCheckedItems = useMutation(api.shoppingList.clearChecked);
  const uncheckAllItems = useMutation(api.shoppingList.uncheckAll);
  const upsertRating = useMutation(api.ratings.upsert);
  const addPriceEntries = useMutation(api.priceHistory.addMultipleEntries);
  const addReceipt = useMutation(api.receipts.add);
  const addAvoidMeal = useMutation(api.preferences.addAvoidMeal);
  const addDislike = useMutation(api.preferences.addDislike);

  // Local state
  const [tab, setTab] = useState<TabType>("plan");
  const [butterQuip, setButterQuip] = useState(getDailyGreeting);
  const [quipKey, setQuipKey] = useState(0);

  // Sheet states
  const [chatSheet, setChatSheet] = useState(false);
  const [editSheet, setEditSheet] = useState<{
    day: DayFull;
    meal: MealType;
    value: string;
  } | null>(null);
  const [mealDetail, setMealDetail] = useState<{
    day: DayFull;
    meal: MealType;
  } | null>(null);
  const [addItemSheet, setAddItemSheet] = useState(false);
  const [daySheet, setDaySheet] = useState<{ day: DayFull } | null>(null);
  const [listFilter, setListFilter] = useState<"All" | "Food" | "Household">("All");
  const [pendingPlan, setPendingPlan] = useState<PlanResponse | null>(null);

  // AI hook
  const { loading, loadLabel, planFullWeek, planDinners, planLunches, planDay, handlePrompt, analyzeReceipt, getRecipe } =
    useAI();

  // Derived state
  const meals = mealPlan?.meals ?? initEmptyMeals();
  const nutrition = mealPlan?.nutrition ?? {};
  const guests = mealPlan?.guests ?? 3;
  const grandmaMode = mealPlan?.grandmaMode ?? false;
  const list: ShoppingItem[] = shoppingListData?.items ?? [];
  const priceHistory = priceHistoryData ?? [];
  const receipts = receiptsData ?? [];
  const preferences = preferencesData ?? { dislikes: [], allergies: [], avoidMeals: [] };

  type RatingMap = Record<string, { prep: number; taste: number }>;
  const ratings: RatingMap = {};
  for (const r of ratingsData ?? []) {
    ratings[r.mealKey] = { prep: r.prep, taste: r.taste };
  }

  const setQuip = useCallback((q: string) => {
    setButterQuip(q);
    setQuipKey((k) => k + 1);
  }, []);

  // Initialize meal plan if it doesn't exist
  useEffect(() => {
    if (mealPlan === null) {
      upsertMealPlan({
        weekId,
        meals: initEmptyMeals(),
        nutrition: {},
        guests: 3,
        grandmaMode: false,
      });
    }
  }, [mealPlan, weekId, upsertMealPlan]);

  // Handlers
  const handleGuestsChange = useCallback(
    (delta: number) => {
      const newGuests = Math.max(1, guests + delta);
      updateSettings({ weekId, guests: newGuests });
    },
    [guests, weekId, updateSettings]
  );

  const handleGrandmaModeToggle = useCallback(() => {
    const newGrandmaMode = !grandmaMode;
    const newGuests = newGrandmaMode ? guests + 1 : Math.max(1, guests - 1);
    updateSettings({ weekId, guests: newGuests, grandmaMode: newGrandmaMode });
  }, [grandmaMode, guests, weekId, updateSettings]);

  const handleWeekChange = useCallback((direction: -1 | 1) => {
    setWeekId((current) => getWeekOffset(current, direction));
  }, []);

  // Accept a pending plan
  const handleAcceptPlan = useCallback(async () => {
    if (!pendingPlan) return;
    await upsertMealPlan({
      weekId,
      meals: pendingPlan.meals as typeof meals,
      nutrition: pendingPlan.nutrition,
      guests,
      grandmaMode,
    });
    if (pendingPlan.shoppingList) {
      const items = pendingPlan.shoppingList.map((item, i) => ({
        id: `i${Date.now()}${i}`,
        ...item,
        checked: false,
      }));
      const householdItems = list.filter((i) => i.category === "Household");
      await upsertShoppingList({ weekId, items: [...items, ...householdItems] });
    }
    if (pendingPlan.butterQuip) setQuip(pendingPlan.butterQuip);
    setPendingPlan(null);
  }, [pendingPlan, weekId, meals, guests, grandmaMode, list, upsertMealPlan, upsertShoppingList, setQuip]);

  const handleRejectPlan = useCallback(() => {
    setPendingPlan(null);
    setQuip("No problem, sugar. Let's try something different!");
  }, [setQuip]);

  const handlePlanFullWeek = useCallback(async () => {
    const result = await planFullWeek(meals, list, guests, preferences);
    if (result) {
      setPendingPlan(result);
    } else {
      setQuip("Butter got distracted by a great recipe. Try again!");
    }
  }, [meals, list, guests, preferences, planFullWeek, setQuip]);

  const handlePlanDinners = useCallback(async () => {
    const result = await planDinners(meals, list, guests, preferences);
    if (result) {
      setPendingPlan(result);
    } else {
      setQuip("Butter got distracted. Try again!");
    }
  }, [meals, list, guests, preferences, planDinners, setQuip]);

  const handlePlanLunches = useCallback(async () => {
    const result = await planLunches(meals, list, guests, preferences);
    if (result) {
      setPendingPlan(result);
    } else {
      setQuip("Couldn't fill lunches right now. Give it another shot!");
    }
  }, [meals, list, guests, preferences, planLunches, setQuip]);

  const handlePlanDay = useCallback(
    async (day: DayFull, customPrompt: string = "") => {
      const result = await planDay(day, meals, list, guests, customPrompt, preferences);
      if (result) {
        await upsertMealPlan({
          weekId,
          meals: result.meals as typeof meals,
          nutrition: result.nutrition,
          guests,
          grandmaMode,
        });
        if (result.shoppingList) {
          const items = result.shoppingList.map((item, i) => ({
            id: `i${Date.now()}${i}`,
            ...item,
            checked: false,
          }));
          const householdItems = list.filter((i) => i.category === "Household");
          await upsertShoppingList({ weekId, items: [...items, ...householdItems] });
        }
        if (result.butterQuip) setQuip(result.butterQuip);
      } else {
        setQuip(`Butter fumbled ${day}. Try again, sugar.`);
      }
      setDaySheet(null);
    },
    [meals, list, guests, grandmaMode, weekId, preferences, planDay, upsertMealPlan, upsertShoppingList, setQuip]
  );

  const handleChatPrompt = useCallback(
    async (prompt: string) => {
      // Check if user is expressing dislike for something
      const dislikeMatch = prompt.toLowerCase().match(/(?:we |i )(?:don't|dont|do not) (?:like|want|eat) (.+)/);
      if (dislikeMatch) {
        const dislikedItem = dislikeMatch[1].trim().replace(/[.!?]$/, "");
        await addDislike({ item: dislikedItem });
        setQuip(`Got it, honey! I'll remember y'all don't like ${dislikedItem}.`);
        return true;
      }

      const result = await handlePrompt(prompt, meals, list, guests, preferences);
      if (result) {
        await upsertMealPlan({
          weekId,
          meals: result.meals as typeof meals,
          nutrition: result.nutrition,
          guests,
          grandmaMode,
        });
        if (result.shoppingList) {
          const items = result.shoppingList.map((item, i) => ({
            id: `i${Date.now()}${i}`,
            ...item,
            checked: false,
          }));
          const householdItems = list.filter((i) => i.category === "Household");
          await upsertShoppingList({ weekId, items: [...items, ...householdItems] });
        }
        if (result.butterQuip) setQuip(result.butterQuip);
        return true;
      } else {
        setQuip("Something got stuck in my apron. Try again, honey.");
        return false;
      }
    },
    [meals, list, guests, grandmaMode, weekId, preferences, handlePrompt, addDislike, upsertMealPlan, upsertShoppingList, setQuip]
  );

  const handleSaveMeal = useCallback(
    async (day: DayFull, mealType: MealType, mealName: string) => {
      await updateMeal({ weekId, day, mealType, mealName });
      setEditSheet(null);
    },
    [weekId, updateMeal]
  );

  const handleRating = useCallback(
    async (day: DayFull, mealType: MealType, field: "prep" | "taste", value: number) => {
      const mealKey = `${weekId}-${day}-${mealType}`;
      const mealName = meals[day]?.[mealType] ?? "";
      const existing = ratings[mealKey] ?? { prep: 0, taste: 0 };
      await upsertRating({
        mealKey,
        mealName,
        prep: field === "prep" ? value : existing.prep,
        taste: field === "taste" ? value : existing.taste,
      });

      // If taste rating is 2 or less, add to avoid meals
      if (field === "taste" && value <= 2 && mealName) {
        await addAvoidMeal({ mealName });
        setQuip(`I'll remember not to suggest ${mealName} again, sugar.`);
      }
    },
    [weekId, meals, ratings, upsertRating, addAvoidMeal, setQuip]
  );

  const handleToggleItem = useCallback(
    (itemId: string) => {
      toggleShoppingItem({ weekId, itemId });
    },
    [weekId, toggleShoppingItem]
  );

  const handleAddItem = useCallback(
    async (item: ShoppingItem) => {
      await addShoppingItem({ weekId, item });
      setAddItemSheet(false);
    },
    [weekId, addShoppingItem]
  );

  const handleClearChecked = useCallback(() => {
    clearCheckedItems({ weekId });
  }, [weekId, clearCheckedItems]);

  const handleUncheckAll = useCallback(() => {
    uncheckAllItems({ weekId });
  }, [weekId, uncheckAllItems]);

  const handleReceiptAnalyzed = useCallback(
    async (
      receiptData: {
        store: string;
        date: string;
        total: number;
        items: Array<{ name: string; price: number; quantity?: string; unit?: string }>;
        butterQuip: string;
      }
    ) => {
      await addReceipt({
        store: receiptData.store,
        date: receiptData.date,
        total: receiptData.total,
        items: receiptData.items,
      });

      const priceEntries = receiptData.items.map((item) => ({
        ingredientKey: item.name.toLowerCase().trim(),
        displayName: item.name,
        entry: {
          date: receiptData.date,
          price: item.price,
          store: receiptData.store,
          quantity: item.quantity,
        },
      }));
      await addPriceEntries({ items: priceEntries });

      if (receiptData.butterQuip) {
        setQuip(receiptData.butterQuip);
      }
    },
    [addReceipt, addPriceEntries, setQuip]
  );

  const remaining = list.filter((i) => !i.checked).length;
  const anySheet = chatSheet || editSheet || mealDetail || addItemSheet || daySheet || pendingPlan;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        fontFamily: "var(--font-nunito), sans-serif",
        background: T.bg,
        color: T.brown,
        height: "100%",
        maxHeight: "100vh",
      }}
    >
      <Header
        guests={guests}
        grandmaMode={grandmaMode}
        onGuestsChange={handleGuestsChange}
        onGrandmaModeToggle={handleGrandmaModeToggle}
      />

      <ButterQuip quip={butterQuip} quipKey={quipKey} />

      <div className="flex-1 overflow-hidden" key={tab}>
        {tab === "plan" && (
          <MealGrid
            meals={meals}
            nutrition={nutrition}
            ratings={ratings}
            weekId={weekId}
            loading={loading}
            loadLabel={loadLabel}
            onPlanFullWeek={handlePlanFullWeek}
            onPlanDinners={handlePlanDinners}
            onPlanLunches={handlePlanLunches}
            onCellClick={(day, meal) => {
              const val = meals[day]?.[meal] ?? "";
              if (val) {
                setMealDetail({ day, meal });
              } else {
                setEditSheet({ day, meal, value: "" });
              }
            }}
            onDayClick={(day) => setDaySheet({ day })}
            onWeekChange={handleWeekChange}
          />
        )}

        {tab === "list" && (
          <ShoppingList
            items={list}
            listFilter={listFilter}
            priceHistory={priceHistory}
            onFilterChange={setListFilter}
            onToggleItem={handleToggleItem}
            onAddItemClick={() => setAddItemSheet(true)}
            onClearChecked={handleClearChecked}
            onUncheckAll={handleUncheckAll}
          />
        )}

        {tab === "receipt" && (
          <ReceiptScanner
            receipts={receipts}
            loading={loading}
            loadLabel={loadLabel}
            onAnalyze={analyzeReceipt}
            onReceiptAnalyzed={handleReceiptAnalyzed}
          />
        )}

        {tab === "prices" && <PriceTracker priceHistory={priceHistory} />}
      </div>

      {!anySheet && (
        <button
          onClick={() => setChatSheet(true)}
          className="fixed z-50 flex items-center gap-2 rounded-full font-extrabold shadow-lg transition-transform active:scale-95"
          style={{
            bottom: "calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 12px)",
            right: "var(--sheet-margin)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            fontSize: "var(--font-sm)",
            background: `linear-gradient(135deg, ${T.butter}, #F0A820)`,
            color: T.brown,
            boxShadow: `0 6px 24px rgba(212,146,10,0.5)`,
          }}
        >
          <span>🧈</span> Ask Butter
        </button>
      )}

      {anySheet && (
        <div
          onClick={() => {
            setChatSheet(false);
            setEditSheet(null);
            setMealDetail(null);
            setAddItemSheet(false);
            setDaySheet(null);
            setPendingPlan(null);
          }}
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        />
      )}

      {chatSheet && (
        <ChatSheet
          loading={loading}
          loadLabel={loadLabel}
          onSubmit={async (prompt) => {
            const success = await handleChatPrompt(prompt);
            if (success) setChatSheet(false);
          }}
          onClose={() => setChatSheet(false)}
        />
      )}

      {editSheet && (
        <EditSheet
          day={editSheet.day}
          meal={editSheet.meal}
          initialValue={editSheet.value}
          onSave={(value) => handleSaveMeal(editSheet.day, editSheet.meal, value)}
          onClose={() => setEditSheet(null)}
        />
      )}

      {mealDetail && (
        <MealDetailSheet
          day={mealDetail.day}
          meal={mealDetail.meal}
          mealName={meals[mealDetail.day]?.[mealDetail.meal] ?? ""}
          nutrition={nutrition[`${mealDetail.day}-${mealDetail.meal}`]}
          rating={ratings[`${weekId}-${mealDetail.day}-${mealDetail.meal}`] ?? { prep: 0, taste: 0 }}
          guests={guests}
          loading={loading}
          loadLabel={loadLabel}
          onRatingChange={(field, value) => handleRating(mealDetail.day, mealDetail.meal, field, value)}
          onGetRecipe={getRecipe}
          onEdit={() => {
            setMealDetail(null);
            setEditSheet({
              day: mealDetail.day,
              meal: mealDetail.meal,
              value: meals[mealDetail.day]?.[mealDetail.meal] ?? "",
            });
          }}
          onClose={() => setMealDetail(null)}
        />
      )}

      {addItemSheet && (
        <AddItemSheet
          onAdd={handleAddItem}
          onClose={() => setAddItemSheet(false)}
        />
      )}

      {daySheet && (
        <DaySheet
          day={daySheet.day}
          meals={meals[daySheet.day]}
          loading={loading}
          loadLabel={loadLabel}
          onPlan={handlePlanDay}
          onEditMeal={(mealType) => {
            setDaySheet(null);
            setEditSheet({
              day: daySheet.day,
              meal: mealType,
              value: meals[daySheet.day]?.[mealType] ?? "",
            });
          }}
          onClose={() => setDaySheet(null)}
        />
      )}

      {pendingPlan && (
        <PreviewSheet
          plan={pendingPlan}
          onAccept={handleAcceptPlan}
          onReject={handleRejectPlan}
        />
      )}

      <BottomNav tab={tab} onTabChange={setTab} listCount={remaining} />
    </div>
  );
}
