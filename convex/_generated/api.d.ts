/* eslint-disable */
/**
 * Generated API stub - will be replaced by `npx convex dev`
 */
import type { FunctionReference } from "convex/server";

type AnyFunctionReference = FunctionReference<any, any, any, any>;

export declare const api: {
  mealPlans: {
    getByWeek: AnyFunctionReference;
    getCurrent: AnyFunctionReference;
    upsert: AnyFunctionReference;
    updateMeal: AnyFunctionReference;
    updateNutrition: AnyFunctionReference;
    updateSettings: AnyFunctionReference;
  };
  shoppingList: {
    getByWeek: AnyFunctionReference;
    upsert: AnyFunctionReference;
    toggleItem: AnyFunctionReference;
    markHaveIt: AnyFunctionReference;
    addItem: AnyFunctionReference;
    removeItem: AnyFunctionReference;
    clearChecked: AnyFunctionReference;
    uncheckAll: AnyFunctionReference;
  };
  ratings: {
    getAllForWeek: AnyFunctionReference;
    upsert: AnyFunctionReference;
  };
  priceHistory: {
    getAll: AnyFunctionReference;
    getByIngredient: AnyFunctionReference;
    addEntry: AnyFunctionReference;
    addMultipleEntries: AnyFunctionReference;
  };
  favorites: {
    getAll: AnyFunctionReference;
    add: AnyFunctionReference;
    remove: AnyFunctionReference;
    isFavorite: AnyFunctionReference;
  };
  receipts: {
    getAll: AnyFunctionReference;
    getRecent: AnyFunctionReference;
    getByStore: AnyFunctionReference;
    add: AnyFunctionReference;
    remove: AnyFunctionReference;
  };
};

export declare const internal: Record<string, never>;
