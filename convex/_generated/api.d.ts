/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as budgetGoals from "../budgetGoals.js";
import type * as favorites from "../favorites.js";
import type * as mealPlans from "../mealPlans.js";
import type * as preferences from "../preferences.js";
import type * as priceHistory from "../priceHistory.js";
import type * as ratings from "../ratings.js";
import type * as receipts from "../receipts.js";
import type * as shoppingList from "../shoppingList.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  budgetGoals: typeof budgetGoals;
  favorites: typeof favorites;
  mealPlans: typeof mealPlans;
  preferences: typeof preferences;
  priceHistory: typeof priceHistory;
  ratings: typeof ratings;
  receipts: typeof receipts;
  shoppingList: typeof shoppingList;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
