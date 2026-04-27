"use client";

import { useState, useCallback } from "react";
import { BUTTER_PERSONA, getCurrentWeekId, DAYS_FULL, MEAL_TYPES } from "./constants";

interface PlanResponse {
  butterQuip: string;
  meals: Record<string, Record<string, string>>;
  nutrition: Record<string, { calories: number; protein: number; carbs: number; fat: number }>;
  shoppingList: Array<{
    ingredient: string;
    quantity: string;
    unit: string;
    meal: string;
    mealKey: string;
    category: string;
  }>;
}

interface ReceiptItem {
  name: string;
  price: number;
  quantity?: string;
  unit?: string;
  category?: string;
}

interface ReceiptResponse {
  butterQuip: string;
  store: string;
  date: string;
  items: ReceiptItem[];
  total: number;
}

interface RecipeResponse {
  butterQuip: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: Array<{ item: string; amount: string }>;
  steps: string[];
  tips?: string;
}

// API key is bundled at build time for static export (fine for personal use)
const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "";

async function callClaude(
  userContent: string | Array<{ type: string; source?: unknown; text?: string }>,
  system: string
): Promise<string> {
  const messages = [
    {
      role: "user",
      content: userContent,
    },
  ];

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90 second timeout

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system,
        messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      throw new Error("Failed to call Claude API");
    }

    const data = await response.json();
    if (data.stop_reason === "max_tokens") {
      console.error("Claude response was truncated (hit max_tokens). Output is incomplete.");
      throw new Error("Response was too long and got cut off. Try a smaller request.");
    }
    return data.content?.[0]?.text || "";
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

interface RatingFeedback {
  favorites: string[];
  disliked: string[];
  easyMeals: string[];
  hardMeals: string[];
}

interface Preferences {
  dislikes: string[];
  allergies: string[];
  avoidMeals: string[];
  substitutions?: Array<{ original: string; replacement: string }>;
  ratingFeedback?: RatingFeedback;
}

function buildPlanSystem(guests: number, prefs: Preferences, grandmaMode: boolean, extra: string = "") {
  let prefsText = "";
  if (prefs.dislikes.length > 0) {
    prefsText += `\nDISLIKES (DO NOT INCLUDE): ${prefs.dislikes.join(", ")}`;
  }
  if (prefs.allergies.length > 0) {
    prefsText += `\nALLERGIES (NEVER INCLUDE): ${prefs.allergies.join(", ")}`;
  }
  if (prefs.avoidMeals.length > 0) {
    prefsText += `\nMEALS TO AVOID (poorly rated): ${prefs.avoidMeals.join(", ")}`;
  }
  if (prefs.substitutions && prefs.substitutions.length > 0) {
    const subs = prefs.substitutions.map((s) => `${s.original} → ${s.replacement}`).join(", ");
    prefsText += `\nSUBSTITUTIONS (always use these): ${subs}`;
  }

  // Rating feedback - what the family actually liked/disliked
  if (prefs.ratingFeedback) {
    const rf = prefs.ratingFeedback;
    if (rf.favorites.length > 0) {
      prefsText += `\nFAMILY FAVORITES (they loved these, include similar or these again): ${rf.favorites.slice(0, 10).join(", ")}`;
    }
    if (rf.disliked.length > 0) {
      prefsText += `\nDIDN'T LIKE (avoid these or similar): ${rf.disliked.join(", ")}`;
    }
    if (rf.easyMeals.length > 0) {
      prefsText += `\nEASY TO MAKE (prefer these styles): ${rf.easyMeals.slice(0, 8).join(", ")}`;
    }
    if (rf.hardMeals.length > 0) {
      prefsText += `\nTOO HARD (avoid similar complexity): ${rf.hardMeals.join(", ")}`;
    }
  }

  let guestInfo = `${guests} people`;
  let grandmaNote = "";
  if (grandmaMode) {
    guestInfo = `${guests} people normally, but ${guests + 1} people when Grandma visits`;
    grandmaNote = `
GRANDMA VISITS: Sat-Tue schedule:
- Saturday dinner = ${guests + 1} people
- Sunday dinner = ${guests + 1} people
- Monday dinner = ${guests + 1} people
- Tuesday dinner = ${guests} people (she leaves before dinner)
- Wed/Thu/Fri dinner = ${guests} people`;
  }

  return `${BUTTER_PERSONA}${extra}${prefsText}${grandmaNote}
Return ONLY valid JSON (no markdown, no extra text):
{
  "butterQuip":"",
  "meals":{"Monday":{"Dinner":""},"Tuesday":{"Dinner":""},"Wednesday":{"Dinner":""},"Thursday":{"Dinner":""},"Friday":{"Dinner":""},"Saturday":{"Dinner":""},"Sunday":{"Dinner":""}},
  "nutrition":{"Monday-Dinner":{"calories":0,"protein":0,"carbs":0,"fat":0}},
  "shoppingList":[{"ingredient":"","quantity":"","unit":"","meal":"Day Dinner — MealName","mealKey":"Day-Dinner","category":"Produce|Meat & Seafood|Dairy & Eggs|Pantry|Frozen|Bakery|Beverages|Household|Other"}]
}
Rules: keep existing dinners unless request changes them. Scale ingredient quantities according to the guest count for each specific dinner (accounting for Grandma's schedule if applicable).
SHOPPING LIST RULES:
- DO NOT consolidate ingredients across different meals. If two meals both use chicken, emit TWO separate shopping list rows — one for each meal — so each meal owns its own ingredients.
- Each shopping list item must include a "mealKey" field formatted exactly as "Day-MealType" (e.g. "Monday-Dinner", "Tuesday-Lunch"). The "meal" field is for display ("Monday Dinner — Chicken Tacos"); the "mealKey" field is for matching.
- Every shopping list item MUST belong to exactly one meal. No "All week" or multi-meal entries.
IMPORTANT: nutrition key format is "Day-Dinner" (e.g. "Monday-Dinner"). Provide nutrition for every dinner that has a name. Calories and macros should be PER PERSON values. Return ONLY the JSON.`;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [loadLabel, setLoadLabel] = useState("");

  const planFullWeek = useCallback(
    async (
      currentMeals: Record<string, Record<string, string>>,
      currentList: unknown[],
      guests: number,
      prefs: Preferences = { dislikes: [], allergies: [], avoidMeals: [] },
      grandmaMode: boolean = false
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel("Planning dinners...");
      try {
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: Plan a complete, varied, and delicious week of DINNERS for ${guests} people — one dinner for each of the 7 days. Make it feel cohesive but varied. Think about the week as a whole. Include a mix of cuisines and cooking styles.`,
          buildPlanSystem(guests, prefs, grandmaMode, "\nFocus: plan dinners only. Be creative, varied, and practical. Include quick weeknight meals and maybe something special for the weekend.")
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return parsed;
      } catch (e) {
        console.error("Plan error:", e);
        return null;
      } finally {
        setLoading(false);
        setLoadLabel("");
      }
    },
    []
  );

  const planDinners = useCallback(
    async (
      currentMeals: Record<string, Record<string, string>>,
      currentList: unknown[],
      guests: number,
      prefs: Preferences = { dislikes: [], allergies: [], avoidMeals: [] },
      grandmaMode: boolean = false
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel("Planning dinners...");
      try {
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: Plan a full week of varied, delicious dinners for ${guests} people. Keep any existing dinners already set.`,
          buildPlanSystem(guests, prefs, grandmaMode, "\nFocus: fill all dinner slots. Keep breakfasts and lunches as-is.")
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return parsed;
      } catch (e) {
        console.error("Plan error:", e);
        return null;
      } finally {
        setLoading(false);
        setLoadLabel("");
      }
    },
    []
  );

  const planLunches = useCallback(
    async (
      currentMeals: Record<string, Record<string, string>>,
      currentList: unknown[],
      guests: number,
      prefs: Preferences = { dislikes: [], allergies: [], avoidMeals: [] },
      grandmaMode: boolean = false
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel("Filling lunches...");
      try {
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: Fill in all lunches for the week for ${guests} people. Keep existing lunches. Make them quick, practical, and real.`,
          buildPlanSystem(guests, prefs, grandmaMode, "\nFocus: fill lunch slots only. Keep dinners and breakfasts unchanged.")
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return parsed;
      } catch (e) {
        console.error("Plan error:", e);
        return null;
      } finally {
        setLoading(false);
        setLoadLabel("");
      }
    },
    []
  );

  const planDay = useCallback(
    async (
      day: string,
      currentMeals: Record<string, Record<string, string>>,
      currentList: unknown[],
      guests: number,
      customPrompt: string = "",
      prefs: Preferences = { dislikes: [], allergies: [], avoidMeals: [] },
      grandmaMode: boolean = false
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel(`Planning ${day}...`);
      try {
        const request = customPrompt.trim()
          ? `Plan dinner for ${day} for ${guests} people. Extra guidance: ${customPrompt}`
          : `Plan a delicious dinner for ${day} for ${guests} people.`;
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: ${request}`,
          buildPlanSystem(guests, prefs, grandmaMode, `\nFocus: ONLY update dinner for ${day}. Leave all other days completely unchanged.`)
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return parsed;
      } catch (e) {
        console.error("Plan error:", e);
        return null;
      } finally {
        setLoading(false);
        setLoadLabel("");
      }
    },
    []
  );

  const handlePrompt = useCallback(
    async (
      prompt: string,
      currentMeals: Record<string, Record<string, string>>,
      currentList: unknown[],
      guests: number,
      prefs: Preferences = { dislikes: [], allergies: [], avoidMeals: [] },
      grandmaMode: boolean = false
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel("Thinking...");
      try {
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: ${prompt}`,
          buildPlanSystem(guests, prefs, grandmaMode)
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return parsed;
      } catch (e) {
        console.error("Prompt error:", e);
        return null;
      } finally {
        setLoading(false);
        setLoadLabel("");
      }
    },
    []
  );

  const analyzeReceipt = useCallback(
    async (imageBase64: string, mediaType: string, store: string): Promise<ReceiptResponse | null> => {
      setLoading(true);
      setLoadLabel("Reading receipt...");
      try {
        const today = new Date().toISOString().split("T")[0];
        const raw = await callClaude(
          [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Extract all items from this grocery receipt.

STEP 1 - FIND THE TRANSACTION DATE (this is critical!):
- Look near the TOP of the receipt for a date/time stamp
- Look for patterns like "04/12/26", "04-12-2026", "APR 12 2026", "April 12, 2026"
- The date is usually on the same line as or near the time (e.g., "04/12/26 14:32")
- We are currently in the year 2026, so dates like "04/12/26" mean April 12, 2026
- DO NOT default to today (${today}) - find the actual printed date

STEP 2 - Extract items:
- Product name: NORMALIZE to common grocery terms for price tracking:
  * Remove store brands/prefixes (Great Value, Kirkland, Simply Nature, etc.)
  * Remove size/weight info (16oz, 1lb, etc.)
  * Expand abbreviations: BNLS→Boneless, SKNLS→Skinless, CHKN→Chicken, BRST→Breast, ORG→Organic, GRN→Green, etc.
  * Use consistent naming: "GLDN DLCS BNLS SKNLS CHKN BRST" → "Boneless Skinless Chicken Breast"
  * Keep organic/specialty markers only if relevant: "ORG MILK" → "Organic Milk"
  * Examples: "GV 2% MILK GAL" → "2% Milk", "FRSH GRND BEEF 80/20" → "Ground Beef 80/20"
- Category: Assign each item to one of these categories:
  * Produce (fruits, vegetables)
  * Meat & Seafood (chicken, beef, pork, fish, etc.)
  * Dairy & Eggs (milk, cheese, yogurt, eggs)
  * Pantry (canned goods, pasta, rice, spices, condiments)
  * Frozen (frozen foods)
  * Bakery (bread, rolls, pastries)
  * Beverages (drinks, juice, soda)
  * Household (cleaning supplies, paper towels, trash bags, toiletries, pet supplies, non-food items)
  * Other (anything else)
- PRICE - CRITICAL: Calculate UNIT PRICE, not line total!
  * If receipt shows "APPLES x3  $4.50" → price should be 1.50 (4.50 ÷ 3)
  * If receipt shows "2 @ $2.99  $5.98" → price should be 2.99 (the unit price)
  * If receipt shows weight-based items like "1.5 LB @ $3.99/LB  $5.99" → price should be 3.99 (per lb)
  * Look for quantity indicators: "x2", "2@", "QTY 2", or a number before the item name
  * The price field should ALWAYS be the price for ONE unit/lb, not the line total
- Skip subtotals, tax, payment info

STEP 3 - Find the total at the bottom.`,
            },
          ],
          `You are a receipt scanner. Be precise about the DATE - it's printed on every receipt.
Return ONLY valid JSON:
{
  "butterQuip": "short friendly comment",
  "store": "${store}",
  "date": "YYYY-MM-DD",
  "items": [{"name": "Item", "price": 0.00, "quantity": "1", "unit": "ea", "category": "Produce|Meat & Seafood|Dairy & Eggs|Pantry|Frozen|Bakery|Beverages|Household|Other"}],
  "total": 0.00
}
IMPORTANT: The date field must be the date PRINTED ON THE RECEIPT, not today's date. Each item MUST have a category.`
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return parsed;
      } catch (e) {
        console.error("Receipt error:", e);
        return null;
      } finally {
        setLoading(false);
        setLoadLabel("");
      }
    },
    []
  );

  const swapMeal = useCallback(
    async (
      day: string,
      mealType: string,
      currentMeal: string,
      currentMeals: Record<string, Record<string, string>>,
      guests: number,
      prefs: Preferences = { dislikes: [], allergies: [], avoidMeals: [] }
    ): Promise<{
      newMeal: string;
      butterQuip: string;
      nutrition?: { calories: number; protein: number; carbs: number; fat: number };
      ingredients: Array<{ ingredient: string; quantity: string; unit: string; category: string }>;
    } | null> => {
      setLoading(true);
      setLoadLabel("Finding something else...");
      try {
        let prefsText = "";
        if (prefs.dislikes.length > 0) {
          prefsText += `\nDISLIKES: ${prefs.dislikes.join(", ")}`;
        }
        if (prefs.avoidMeals.length > 0) {
          prefsText += `\nAVOID: ${prefs.avoidMeals.join(", ")}`;
        }
        if (prefs.substitutions && prefs.substitutions.length > 0) {
          const subs = prefs.substitutions.map((s) => `${s.original} → ${s.replacement}`).join(", ");
          prefsText += `\nSUBSTITUTIONS: ${subs}`;
        }
        const raw = await callClaude(
          `Current ${day} meals: ${JSON.stringify(currentMeals[day])}\nCurrent ${mealType}: "${currentMeal}"\n\nSuggest a DIFFERENT ${mealType.toLowerCase()} for ${day}. It should be completely different from "${currentMeal}" but appropriate for ${mealType.toLowerCase()}. For ${guests} people.${prefsText}`,
          `${BUTTER_PERSONA}
Return ONLY valid JSON (no markdown):
{
  "newMeal": "Name of the new meal",
  "butterQuip": "A short quip about the swap",
  "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
  "ingredients": [{"ingredient": "chicken breast", "quantity": "2", "unit": "lbs", "category": "Meat & Seafood"}]
}
Return ONLY the JSON. Nutrition values are per person.`
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return parsed;
      } catch (e) {
        console.error("Swap error:", e);
        return null;
      } finally {
        setLoading(false);
        setLoadLabel("");
      }
    },
    []
  );

  const getRecipe = useCallback(
    async (mealName: string, servings: number, prefs: Preferences = { dislikes: [], allergies: [], avoidMeals: [] }): Promise<RecipeResponse | null> => {
      setLoading(true);
      setLoadLabel("Writing recipe...");
      try {
        let subsNote = "";
        if (prefs.substitutions && prefs.substitutions.length > 0) {
          const subs = prefs.substitutions.map((s) => `${s.original} → ${s.replacement}`).join(", ");
          subsNote = `\nIMPORTANT SUBSTITUTIONS (use these instead): ${subs}`;
        }
        const raw = await callClaude(
          `Generate a detailed, practical recipe for: "${mealName}" for ${servings} people. Make it home-cook friendly with common ingredients.${subsNote}`,
          `${BUTTER_PERSONA}
Return ONLY valid JSON (no markdown):
{
  "butterQuip": "",
  "prepTime": "15 mins",
  "cookTime": "30 mins",
  "servings": ${servings},
  "ingredients": [{"item": "ingredient name", "amount": "1 cup"}],
  "steps": ["Step 1 instruction", "Step 2 instruction"],
  "tips": "Optional helpful tip"
}
Be specific with measurements and times. Steps should be clear and concise. Return ONLY the JSON.`
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        return parsed;
      } catch (e) {
        console.error("Recipe error:", e);
        return null;
      } finally {
        setLoading(false);
        setLoadLabel("");
      }
    },
    []
  );

  return {
    loading,
    loadLabel,
    planFullWeek,
    planDinners,
    planLunches,
    planDay,
    handlePrompt,
    analyzeReceipt,
    swapMeal,
    getRecipe,
  };
}
