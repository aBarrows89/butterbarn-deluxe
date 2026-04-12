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
    category: string;
  }>;
}

interface ReceiptItem {
  name: string;
  price: number;
  quantity?: string;
  unit?: string;
}

interface ReceiptResponse {
  butterQuip: string;
  store: string;
  date: string;
  items: ReceiptItem[];
  total: number;
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
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout

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
        max_tokens: 4096,
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
    return data.content?.[0]?.text || "";
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function buildPlanSystem(guests: number, extra: string = "") {
  return `${BUTTER_PERSONA}${extra}
Return ONLY valid JSON (no markdown, no extra text):
{
  "butterQuip":"",
  "meals":{"Monday":{"Breakfast":"","Lunch":"","Dinner":"","Snacks":""},"Tuesday":{"Breakfast":"","Lunch":"","Dinner":"","Snacks":""},"Wednesday":{"Breakfast":"","Lunch":"","Dinner":"","Snacks":""},"Thursday":{"Breakfast":"","Lunch":"","Dinner":"","Snacks":""},"Friday":{"Breakfast":"","Lunch":"","Dinner":"","Snacks":""},"Saturday":{"Breakfast":"","Lunch":"","Dinner":"","Snacks":""},"Sunday":{"Breakfast":"","Lunch":"","Dinner":"","Snacks":""}},
  "nutrition":{"Monday-Breakfast":{"calories":0,"protein":0,"carbs":0,"fat":0}},
  "shoppingList":[{"ingredient":"","quantity":"","unit":"","meal":"Day MealType — MealName","category":"Produce|Meat & Seafood|Dairy & Eggs|Pantry|Frozen|Bakery|Beverages|Household|Other"}]
}
Rules: keep existing meals unless request changes them. Scale quantities for ${guests} people. Consolidate duplicate ingredients. Each list item must reference its meal(s).
IMPORTANT: nutrition key format is "Day-MealType" (e.g. "Monday-Dinner"). Provide nutrition for every meal that has a name. Calories and macros should be realistic per serving for ${guests} people total (so divide by guests for per-person). Actually provide PER PERSON values. Return ONLY the JSON.`;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [loadLabel, setLoadLabel] = useState("");

  const planFullWeek = useCallback(
    async (
      currentMeals: Record<string, Record<string, string>>,
      currentList: unknown[],
      guests: number
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel("Planning the whole week...");
      try {
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: Plan a complete, varied, and delicious full week of meals for ${guests} people — breakfast, lunch, dinner, and snacks for all 7 days. Make it feel cohesive but varied. Think about the week as a whole.`,
          buildPlanSystem(guests, "\nFocus: fill every single meal slot for all 7 days. Be creative, varied, and practical.")
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
      guests: number
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel("Planning dinners...");
      try {
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: Plan a full week of varied, delicious dinners for ${guests} people. Keep any existing dinners already set.`,
          buildPlanSystem(guests, "\nFocus: fill all dinner slots. Keep breakfasts and lunches as-is.")
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
      guests: number
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel("Filling lunches...");
      try {
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: Fill in all lunches for the week for ${guests} people. Keep existing lunches. Make them quick, practical, and real.`,
          buildPlanSystem(guests, "\nFocus: fill lunch slots only. Keep dinners and breakfasts unchanged.")
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
      customPrompt: string = ""
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel(`Planning ${day}...`);
      try {
        const request = customPrompt.trim()
          ? `Plan all meals (breakfast, lunch, dinner, snacks) for ${day} for ${guests} people. Extra guidance: ${customPrompt}`
          : `Plan all meals (breakfast, lunch, dinner, snacks) for ${day} for ${guests} people. Make them varied and delicious.`;
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: ${request}`,
          buildPlanSystem(guests, `\nFocus: ONLY update the meals for ${day}. Leave all other days completely unchanged.`)
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
      guests: number
    ): Promise<PlanResponse | null> => {
      setLoading(true);
      setLoadLabel("Thinking...");
      try {
        const raw = await callClaude(
          `Current plan: ${JSON.stringify(currentMeals)}\nList: ${JSON.stringify(currentList)}\nRequest: ${prompt}`,
          buildPlanSystem(guests)
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
              text: "Extract every line item from this grocery receipt.",
            },
          ],
          `${BUTTER_PERSONA}\nReturn ONLY valid JSON: {"butterQuip":"","store":"${store}","date":"YYYY-MM-DD","items":[{"name":"","price":0.00,"quantity":"1","unit":"ea"}],"total":0.00}`
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

  return {
    loading,
    loadLabel,
    planFullWeek,
    planDinners,
    planLunches,
    planDay,
    handlePrompt,
    analyzeReceipt,
  };
}
