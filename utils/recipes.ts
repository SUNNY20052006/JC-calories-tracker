import { FoodAnalysisResult, Recipe, RecipeSelection } from '../types';

export function parseServings(text: string): number | null {
  const amount = Number(text.trim().replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function nutritionForServings(recipe: Recipe, servings: number): Omit<FoodAnalysisResult, 'foodItems'> {
  if (!Number.isFinite(servings) || servings <= 0 || !Number.isFinite(recipe.servings) || recipe.servings <= 0) {
    throw new Error('Servings must be greater than zero');
  }
  const factor = servings / recipe.servings;
  return {
    calories: recipe.calories * factor,
    protein: recipe.protein * factor,
    carbs: recipe.carbs * factor,
    fat: recipe.fat * factor,
  };
}

export function combineMeal(analysis: FoodAnalysisResult | null, selections: RecipeSelection[]): FoodAnalysisResult | null {
  if (!analysis && selections.length === 0) return null;
  const result: FoodAnalysisResult = {
    foodItems: [...(analysis?.foodItems ?? [])],
    calories: analysis?.calories ?? 0, protein: analysis?.protein ?? 0,
    carbs: analysis?.carbs ?? 0, fat: analysis?.fat ?? 0,
  };
  for (const { recipe, servings } of selections) {
    const item = {
      name: recipe.name, preparation: null, quantity: `${servings} serving(s)`, estimatedWeightGrams: 0,
      ...nutritionForServings(recipe, servings),
    };
    result.foodItems.push(item);
    result.calories += item.calories;
    result.protein += item.protein;
    result.carbs += item.carbs;
    result.fat += item.fat;
  }
  return result;
}

export function mealDescription(text: string, selections: RecipeSelection[]): string {
  return [text.trim(), ...selections.map(s => `${s.servings} serving(s) of ${s.recipe.name}`)].filter(Boolean).join('; ');
}
