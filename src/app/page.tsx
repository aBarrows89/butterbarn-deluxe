"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { App } from "@capacitor/app";
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
import { RecipeBook } from "@/components/RecipeBook";
import { BottomNav } from "@/components/BottomNav";
import { ChatSheet } from "@/components/sheets/ChatSheet";
import { EditSheet } from "@/components/sheets/EditSheet";
import { MealDetailSheet } from "@/components/sheets/MealDetailSheet";
import { AddItemSheet } from "@/components/sheets/AddItemSheet";
import { DaySheet } from "@/components/sheets/DaySheet";
import { PreviewSheet } from "@/components/sheets/PreviewSheet";
import { SettingsSheet } from "@/components/sheets/SettingsSheet";

type TabType = "plan" | "list" | "receipt" | "prices" | "recipes";

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
  const ratingSummary = useQuery(api.ratings.getRatingSummary);
  const priceHistoryData = useQuery(api.priceHistory.getAll);
  const receiptsData = useQuery(api.receipts.getRecent, { limit: 10 });
  const preferencesData = useQuery(api.preferences.get);
  const allRecipesData = useQuery(api.recipes.getAll);

  // Convex mutations
  const upsertMealPlan = useMutation(api.mealPlans.upsert);
  const updateMeal = useMutation(api.mealPlans.updateMeal);
  const updateSettings = useMutation(api.mealPlans.updateSettings);
  const updateNutrition = useMutation(api.mealPlans.updateNutrition);
  const upsertShoppingList = useMutation(api.shoppingList.upsert);
  const toggleShoppingItem = useMutation(api.shoppingList.toggleItem);
  const addShoppingItem = useMutation(api.shoppingList.addItem);
  const addShoppingItems = useMutation(api.shoppingList.addItems);
  const removeItemsByMeal = useMutation(api.shoppingList.removeItemsByMeal);
  const clearCheckedItems = useMutation(api.shoppingList.clearChecked);
  const uncheckAllItems = useMutation(api.shoppingList.uncheckAll);
  const upsertRating = useMutation(api.ratings.upsert);
  const addPriceEntries = useMutation(api.priceHistory.addMultipleEntries);
  const addReceipt = useMutation(api.receipts.add);
  const deleteReceipt = useMutation(api.receipts.remove);
  const addAvoidMeal = useMutation(api.preferences.addAvoidMeal);
  const addDislike = useMutation(api.preferences.addDislike);
  const removeDislike = useMutation(api.preferences.removeDislike);
  const addAllergy = useMutation(api.preferences.addAllergy);
  const removeAllergy = useMutation(api.preferences.removeAllergy);
  const addSubstitution = useMutation(api.preferences.addSubstitution);
  const removeSubstitution = useMutation(api.preferences.removeSubstitution);
  const saveRecipe = useMutation(api.recipes.save);
  const updateRecipeRating = useMutation(api.recipes.updateRating);
  const deleteRecipe = useMutation(api.recipes.remove);

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
  const [settingsSheet, setSettingsSheet] = useState(false);

  // AI hook
  const { loading, loadLabel, planFullWeek, planDinners, planLunches, planDay, handlePrompt, analyzeReceipt, swapMeal, getRecipe } =
    useAI();

  // Keep track of last valid meals to prevent flashing during query refetch
  const lastMealsRef = useRef<{ weekId: string; meals: Record<DayFull, Record<MealType, string>> } | null>(null);
  if (mealPlan?.meals) {
    lastMealsRef.current = { weekId, meals: mealPlan.meals };
  }
  const cachedMeals = lastMealsRef.current?.weekId === weekId ? lastMealsRef.current.meals : null;

  // Derived state - use last known meals during loading to prevent flash
  const meals = mealPlan?.meals ?? cachedMeals ?? initEmptyMeals();
  const nutrition = mealPlan?.nutrition ?? {};
  const guests = mealPlan?.guests ?? 3;
  const grandmaMode = mealPlan?.grandmaMode ?? false;
  const list: ShoppingItem[] = shoppingListData?.items ?? [];
  const priceHistory = priceHistoryData ?? [];
  const receipts = receiptsData ?? [];
  const preferences = {
    ...(preferencesData ?? { dislikes: [], allergies: [], avoidMeals: [], substitutions: [] }),
    ratingFeedback: ratingSummary ?? undefined,
  };
  const allRecipes = allRecipesData ?? [];

  type RatingMap = Record<string, { prep: number; taste: number }>;
  const ratings: RatingMap = {};
  for (const r of ratingsData ?? []) {
    ratings[r.mealKey] = { prep: r.prep, taste: r.taste };
  }

  const setQuip = useCallback((q: string) => {
    setButterQuip(q);
    setQuipKey((k) => k + 1);
  }, []);

  // Android back button handler
  useEffect(() => {
    const handleBackButton = () => {
      // Close any open sheets first
      if (settingsSheet) {
        setSettingsSheet(false);
        return;
      }
      if (chatSheet) {
        setChatSheet(false);
        return;
      }
      if (editSheet) {
        setEditSheet(null);
        return;
      }
      if (mealDetail) {
        setMealDetail(null);
        return;
      }
      if (addItemSheet) {
        setAddItemSheet(false);
        return;
      }
      if (daySheet) {
        setDaySheet(null);
        return;
      }
      if (pendingPlan) {
        setPendingPlan(null);
        return;
      }
      // If not on plan tab, go back to plan
      if (tab !== "plan") {
        setTab("plan");
        return;
      }
      // Otherwise minimize app
      App.minimizeApp();
    };

    const listener = App.addListener("backButton", handleBackButton);
    return () => {
      listener.then((l) => l.remove());
    };
  }, [settingsSheet, chatSheet, editSheet, mealDetail, addItemSheet, daySheet, pendingPlan, tab]);

  // Handlers
  const handleGuestsChange = useCallback(
    (delta: number) => {
      const newGuests = Math.max(1, guests + delta);
      updateSettings({ weekId, guests: newGuests });
    },
    [guests, weekId, updateSettings]
  );

  const handleGrandmaModeToggle = useCallback(() => {
    // Just toggle grandma mode - AI handles the per-day guest count
    // (Grandma visits Sat-Tue, leaves before dinner on Tuesday)
    updateSettings({ weekId, grandmaMode: !grandmaMode });
  }, [grandmaMode, weekId, updateSettings]);

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
    const result = await planFullWeek(meals, list, guests, preferences, grandmaMode);
    if (result) {
      setPendingPlan(result);
    } else {
      setQuip("Butter got distracted by a great recipe. Try again!");
    }
  }, [meals, list, guests, preferences, grandmaMode, planFullWeek, setQuip]);

  const handlePlanDinners = useCallback(async () => {
    const result = await planDinners(meals, list, guests, preferences, grandmaMode);
    if (result) {
      setPendingPlan(result);
    } else {
      setQuip("Butter got distracted. Try again!");
    }
  }, [meals, list, guests, preferences, grandmaMode, planDinners, setQuip]);

  const handlePlanLunches = useCallback(async () => {
    const result = await planLunches(meals, list, guests, preferences, grandmaMode);
    if (result) {
      setPendingPlan(result);
    } else {
      setQuip("Couldn't fill lunches right now. Give it another shot!");
    }
  }, [meals, list, guests, preferences, grandmaMode, planLunches, setQuip]);

  const handlePlanDay = useCallback(
    async (day: DayFull, customPrompt: string = "") => {
      const result = await planDay(day, meals, list, guests, customPrompt, preferences, grandmaMode);
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

      // Check for substitution patterns: "we sub X with Y", "we use X instead of Y", "substitute X with Y"
      const subMatch = prompt.toLowerCase().match(/(?:we |i )?(?:sub|substitute|swap|replace) (.+?) (?:with|for) (.+)/);
      const insteadMatch = prompt.toLowerCase().match(/(?:we |i )?use (.+?) instead of (.+)/);
      if (subMatch) {
        const original = subMatch[1].trim().replace(/[.!?]$/, "");
        const replacement = subMatch[2].trim().replace(/[.!?]$/, "");
        await addSubstitution({ original, replacement });
        setQuip(`You got it, sugar! I'll use ${replacement} instead of ${original} from now on.`);
        return true;
      }
      if (insteadMatch) {
        const replacement = insteadMatch[1].trim().replace(/[.!?]$/, "");
        const original = insteadMatch[2].trim().replace(/[.!?]$/, "");
        await addSubstitution({ original, replacement });
        setQuip(`You got it, sugar! I'll use ${replacement} instead of ${original} from now on.`);
        return true;
      }

      const result = await handlePrompt(prompt, meals, list, guests, preferences, grandmaMode);
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
    [meals, list, guests, grandmaMode, weekId, preferences, handlePrompt, addDislike, addSubstitution, upsertMealPlan, upsertShoppingList, setQuip]
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

      // Update recipe rating too
      if (mealName) {
        await updateRecipeRating({
          mealName,
          prepRating: field === "prep" ? value : undefined,
          tasteRating: field === "taste" ? value : undefined,
        });
      }

      // If taste rating is 2 or less, add to avoid meals
      if (field === "taste" && value <= 2 && mealName) {
        await addAvoidMeal({ mealName });
        setQuip(`I'll remember not to suggest ${mealName} again, sugar.`);
      }
    },
    [weekId, meals, ratings, upsertRating, updateRecipeRating, addAvoidMeal, setQuip]
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

  const handleSaveRecipe = useCallback(
    async (mealName: string, recipe: { prepTime: string; cookTime: string; servings: number; ingredients: Array<{ item: string; amount: string }>; steps: string[]; tips?: string; butterQuip?: string }) => {
      await saveRecipe({
        mealName,
        displayName: mealName,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        tips: recipe.tips,
        butterQuip: recipe.butterQuip,
      });
    },
    [saveRecipe]
  );

  const handleSwapMeal = useCallback(
    async (day: DayFull, mealType: MealType) => {
      const currentMeal = meals[day]?.[mealType] ?? "";
      const result = await swapMeal(day, mealType, currentMeal, meals, guests, preferences);
      if (result) {
        // Update the meal name
        await updateMeal({ weekId, day, mealType, mealName: result.newMeal });
        // Update nutrition separately if provided
        if (result.nutrition) {
          const nutritionKey = `${day}-${mealType}`;
          await updateNutrition({ weekId, nutritionKey, nutrition: result.nutrition });
        }
        // Update shopping list: remove old ingredients, add new ones
        const mealPattern = `${day} ${mealType}`;
        await removeItemsByMeal({ weekId, mealPattern });
        if (result.ingredients && result.ingredients.length > 0) {
          const newItems = result.ingredients.map((ing) => ({
            id: `${day}-${mealType}-${ing.ingredient}-${Date.now()}`,
            ingredient: ing.ingredient,
            quantity: ing.quantity,
            unit: ing.unit,
            meal: `${day} ${mealType} — ${result.newMeal}`,
            category: ing.category,
            checked: false,
          }));
          await addShoppingItems({ weekId, items: newItems });
        }
        if (result.butterQuip) setQuip(result.butterQuip);
        setMealDetail(null);
      } else {
        setQuip("Butter got stuck. Try again, sugar!");
      }
    },
    [meals, guests, preferences, weekId, swapMeal, updateMeal, updateNutrition, removeItemsByMeal, addShoppingItems, setQuip]
  );

  // Find saved recipe for current meal detail
  const currentSavedRecipe = mealDetail
    ? allRecipes.find((r) => r.mealName === (meals[mealDetail.day]?.[mealDetail.meal] ?? "").toLowerCase().trim())
    : null;

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
        onSettingsClick={() => setSettingsSheet(true)}
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
            onDeleteReceipt={(id) => deleteReceipt({ id: id as any })}
          />
        )}

        {tab === "prices" && <PriceTracker priceHistory={priceHistory} receipts={receipts} />}

        {tab === "recipes" && <RecipeBook recipes={allRecipes} onDelete={(mealName) => deleteRecipe({ mealName })} />}
      </div>

      {!anySheet && (
        <button
          onClick={() => setChatSheet(true)}
          className="fixed z-50 flex items-center justify-center rounded-full font-extrabold shadow-lg transition-transform active:scale-95"
          style={{
            bottom: "calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 8px)",
            right: "12px",
            width: "48px",
            height: "48px",
            fontSize: "22px",
            background: `linear-gradient(135deg, ${T.butter}, #F0A820)`,
            color: T.brown,
            boxShadow: `0 4px 16px rgba(212,146,10,0.5)`,
          }}
          title="Ask Butter"
        >
          🧈
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

      {settingsSheet && (
        <SettingsSheet
          preferences={preferences}
          onAddDislike={(item) => addDislike({ item })}
          onRemoveDislike={(item) => removeDislike({ item })}
          onAddAllergy={(item) => addAllergy({ item })}
          onRemoveAllergy={(item) => removeAllergy({ item })}
          onAddSubstitution={(original, replacement) => addSubstitution({ original, replacement })}
          onRemoveSubstitution={(original) => removeSubstitution({ original })}
          onClose={() => setSettingsSheet(false)}
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
          savedRecipe={currentSavedRecipe}
          guests={guests}
          loading={loading}
          loadLabel={loadLabel}
          onRatingChange={(field, value) => handleRating(mealDetail.day, mealDetail.meal, field, value)}
          onGetRecipe={(name, servings) => getRecipe(name, servings, preferences)}
          onSaveRecipe={handleSaveRecipe}
          onSwap={() => handleSwapMeal(mealDetail.day, mealDetail.meal)}
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
