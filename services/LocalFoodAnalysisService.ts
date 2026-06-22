import { FoodAnalysisResult } from '../types';
import { estimateFoodItems, sumFoodItems } from '../utils/portionEstimator';

export function analyzeFoodLocally(text: string, oilPercentage: number): FoodAnalysisResult {
  const foodItems = estimateFoodItems(text, oilPercentage);
  const totals = sumFoodItems(foodItems);

  return {
    foodItems,
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
  };
}
