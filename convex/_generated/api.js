/* eslint-disable */
/**
 * Generated API stub - will be replaced by `npx convex dev`
 *
 * This provides a temporary stub so the app can build before
 * Convex is initialized. Run `npx convex dev` to generate real types.
 */

// Create function references that will work at runtime
const makeFunctionRef = (path) => path;

export const api = {
  mealPlans: {
    getByWeek: makeFunctionRef("mealPlans:getByWeek"),
    getCurrent: makeFunctionRef("mealPlans:getCurrent"),
    upsert: makeFunctionRef("mealPlans:upsert"),
    updateMeal: makeFunctionRef("mealPlans:updateMeal"),
    updateNutrition: makeFunctionRef("mealPlans:updateNutrition"),
    updateSettings: makeFunctionRef("mealPlans:updateSettings"),
  },
  shoppingList: {
    getByWeek: makeFunctionRef("shoppingList:getByWeek"),
    upsert: makeFunctionRef("shoppingList:upsert"),
    toggleItem: makeFunctionRef("shoppingList:toggleItem"),
    markHaveIt: makeFunctionRef("shoppingList:markHaveIt"),
    addItem: makeFunctionRef("shoppingList:addItem"),
    removeItem: makeFunctionRef("shoppingList:removeItem"),
    clearChecked: makeFunctionRef("shoppingList:clearChecked"),
    uncheckAll: makeFunctionRef("shoppingList:uncheckAll"),
  },
  ratings: {
    getAllForWeek: makeFunctionRef("ratings:getAllForWeek"),
    upsert: makeFunctionRef("ratings:upsert"),
  },
  priceHistory: {
    getAll: makeFunctionRef("priceHistory:getAll"),
    getByIngredient: makeFunctionRef("priceHistory:getByIngredient"),
    addEntry: makeFunctionRef("priceHistory:addEntry"),
    addMultipleEntries: makeFunctionRef("priceHistory:addMultipleEntries"),
  },
  favorites: {
    getAll: makeFunctionRef("favorites:getAll"),
    add: makeFunctionRef("favorites:add"),
    remove: makeFunctionRef("favorites:remove"),
    isFavorite: makeFunctionRef("favorites:isFavorite"),
  },
  receipts: {
    getAll: makeFunctionRef("receipts:getAll"),
    getRecent: makeFunctionRef("receipts:getRecent"),
    getByStore: makeFunctionRef("receipts:getByStore"),
    add: makeFunctionRef("receipts:add"),
    remove: makeFunctionRef("receipts:remove"),
  },
};

export const internal = {};
