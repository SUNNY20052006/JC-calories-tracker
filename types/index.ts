export interface NutritionTargets {
  dailyCalories: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}

export interface UserSettings extends NutritionTargets {
  id: number;
  displayName: string | null;
  signedOut: number;
  createdAt: string;
  updatedAt: string;
}

export type SavedProfile = Pick<UserSettings, 'id' | 'displayName'>;

export interface FoodLog {
  id: number;
  foodText: string;
  oilPercentage: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface FoodItem {
  name: string;
  preparation: string | null;
  quantity: string;
  estimatedWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isRaw?: boolean;
}

export interface MealNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodAnalysisResult extends MealNutrition {
  foodItems: FoodItem[];
}

export interface Recipe {
  id: number;
  name: string;
  description: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface RecipeSelection {
  recipe: Recipe;
  servings: number;
}

export interface LocalFoodEntry {
  name: string;
  aliases: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultPortionGrams: number;
  defaultPortionUnit: string;
}

export interface PortionRule {
  unit: string;
  variants: string[];
  defaultGrams: number;
  foodOverrides?: Record<string, number>;
}
