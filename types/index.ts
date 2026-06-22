export interface UserSettings {
  id: number;
  dailyCalories: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface FoodAnalysisResult {
  foodItems: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
