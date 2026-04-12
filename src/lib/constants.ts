// ============ DAYS ============
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const DAYS_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayFull = (typeof DAYS_FULL)[number];

// ============ MEAL TYPES ============
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_ICONS: Record<MealType, string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
  Snacks: "🍿",
};

// ============ STORES ============
export const STORES = [
  "Aldi",
  "Giant Eagle",
  "Walmart",
  "Costco",
  "Trader Joe's",
  "Other",
] as const;

// ============ CATEGORIES ============
export const FOOD_CATEGORIES = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Pantry",
  "Frozen",
  "Bakery",
  "Beverages",
  "Other",
] as const;

export const HOUSEHOLD_CATEGORIES = [
  "Cleaning",
  "Paper Goods",
  "Personal Care",
  "Pet",
  "Other",
] as const;

// ============ PREP TAGS ============
export const PREP_TAGS = [
  "Quick",
  "Slow Cooker",
  "Grill",
  "Oven",
  "No-Cook",
] as const;

// ============ THEME COLORS ============
export const T = {
  bg: "#F7F2EA",
  card: "#FFFFFF",
  green: "#4A7A4D",
  greenL: "#E8F2E8",
  terra: "#C06C45",
  terraL: "#FAEDE6",
  butter: "#D4920A",
  butterL: "#FEF6E0",
  butterD: "#9A6800",
  brown: "#1E1208",
  muted: "#9A8B82",
  border: "#EDE3D8",
  checked: "#A8C5A8",
  headerBg: "#1A0E05",
  household: "#6B7FD4",
  householdL: "#ECEFFE",
  shadow: "0 2px 12px rgba(30,18,8,0.10)",
  shadowLg: "0 8px 32px rgba(30,18,8,0.18)",
  protein: "#4A7A4D",
  carbs: "#C06C45",
  fat: "#D4920A",
  calories: "#5B6FA6",
} as const;

// ============ BUTTER PERSONA ============
export const BUTTER_PERSONA = `You are Butter — the warm, witty, slightly opinionated kitchen companion of Butter Barn Deluxe, Sam's personal meal planning app. Sam shops primarily at Aldi.
Personality: warm Southern aunt energy, loves bold flavors, occasionally sassy, supportive, funny. Calls Sam "honey" or "sugar" sometimes.
Every response MUST include a "butterQuip" (1–2 punchy sentences reacting in character). Be specific, warm, funny.`;

// ============ HELPER: Get current week ID ============
export function getCurrentWeekId(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Get ISO week number
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

// ============ HELPER: Initialize empty meals ============
export function initEmptyMeals(): Record<DayFull, Record<MealType, string>> {
  return DAYS_FULL.reduce(
    (acc, day) => ({
      ...acc,
      [day]: {
        Breakfast: "",
        Lunch: "",
        Dinner: "",
        Snacks: "",
      },
    }),
    {} as Record<DayFull, Record<MealType, string>>
  );
}
