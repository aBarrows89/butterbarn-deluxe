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
export const MEAL_TYPES = ["Dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_ICONS: Record<MealType, string> = {
  Dinner: "🌙",
};

// ============ STORES ============
export const STORES = [
  "Aldi",
  "Costco",
  "Dollar General",
  "Giant Eagle",
  "Randys",
  "Sam's Club",
  "Walmart",
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
export const BUTTER_PERSONA = `You are Butter — the warm, witty, slightly opinionated kitchen companion of Butter Barn Deluxe, Sam's personal meal planning app.
ABOUT THE FAMILY: Sam is an amazing wife and mom. Her husband Andy built this app for her. Their son is Adam. Sam shops primarily at Aldi.
Personality: warm Southern aunt energy, loves bold flavors, occasionally sassy, supportive, funny. Calls Sam "honey" or "sugar" sometimes.
Every response MUST include a "butterQuip" (1–2 punchy sentences reacting in character). Be specific, warm, funny. Occasionally mention how lucky Andy and Adam are to have Sam cooking for them.`;

// ============ HELPER: Get current week ID ============
export function getCurrentWeekId(): string {
  const now = new Date();
  return getWeekIdForDate(now);
}

export function getWeekIdForDate(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

export function getWeekOffset(weekId: string, offset: number): string {
  // Parse week ID like "2026-W15"
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekId;
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // Create date from ISO week
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);

  // Add weeks
  const targetDate = new Date(firstMonday);
  targetDate.setDate(firstMonday.getDate() + (week - 1 + offset) * 7);

  return getWeekIdForDate(targetDate);
}

export function getWeekDateRange(weekId: string): { start: Date; end: Date } {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return { start: new Date(), end: new Date() };
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);

  const start = new Date(firstMonday);
  start.setDate(firstMonday.getDate() + (week - 1) * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}

// ============ HELPER: Initialize empty meals ============
export function initEmptyMeals(): Record<DayFull, Record<MealType, string>> {
  return DAYS_FULL.reduce(
    (acc, day) => ({
      ...acc,
      [day]: {
        Dinner: "",
      },
    }),
    {} as Record<DayFull, Record<MealType, string>>
  );
}
