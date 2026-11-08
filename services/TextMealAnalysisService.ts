import type { SQLiteDatabase } from 'expo-sqlite';
import type { FoodAnalysisResult } from '../types';
import { FOOD_DATABASE } from '../constants/foodDatabase';
import { recordAnalysisUsage } from '../database/AnalysisUsage';
import { cacheConfirmedMeal, getCachedMeal, isValidAnalysis, normalizeMealDescription } from '../database/MealAnalysisCache';
import { analyzeFoodWithGemini } from './GeminiFoodAnalysisService';
import { analyzeFoodLocally } from './LocalFoodAnalysisService';

export interface TextMealAnalysis {
  result: FoodAnalysisResult;
  source: 'database' | 'cache' | 'gemini' | 'fallback';
}

// The general food database contains broad aliases that aren't safe for automatic routing.
const WEIGHED_FOODS = new Map([
  ['cooked white rice', 'Rice'],
  ['cooked rice', 'Rice'],
  ['steamed rice', 'Rice'],
  ['banana', 'Banana'],
  ['apple', 'Apple'],
  ['onion', 'Onion'],
]);

function calculateWeighedFood(text: string, oilPercentage: number): FoodAnalysisResult | null {
  if (oilPercentage !== 100) return null;
  const match = /^(\d+(?:\.\d+)?)\s*(?:g|grams?) (?:of )?(.+)$/.exec(normalizeMealDescription(text));
  if (!match) return null;
  const grams = Number(match[1]);
  if (!Number.isFinite(grams) || grams <= 0 || grams > 10000) return null;

  const name = WEIGHED_FOODS.get(match[2]);
  const food = FOOD_DATABASE.find(entry => entry.name === name);
  if (!food) return null;

  const factor = grams / 100;
  const nutrition = {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Number((food.proteinPer100g * factor).toFixed(1)),
    carbs: Number((food.carbsPer100g * factor).toFixed(1)),
    fat: Number((food.fatPer100g * factor).toFixed(1)),
  };
  return {
    ...nutrition,
    foodItems: [{ name: match[2], preparation: null, quantity: `${grams} g`, estimatedWeightGrams: grams, ...nutrition }],
  };
}

export async function analyzeTextMeal(
  db: SQLiteDatabase,
  text: string,
  oilPercentage: number,
  forceGemini = false,
  profileId = 1
): Promise<TextMealAnalysis> {
  if (!forceGemini) {
    // A confirmed estimate takes precedence over the bundled values.
    const cached = await getCachedMeal(db, text, oilPercentage, profileId).catch(() => null);
    if (cached) {
      await recordAnalysisUsage(db, 'cache', undefined, profileId).catch(() => {});
      return { result: cached, source: 'cache' };
    }
    const local = calculateWeighedFood(text, oilPercentage);
    if (local) {
      await recordAnalysisUsage(db, 'database', undefined, profileId).catch(() => {});
      return { result: local, source: 'database' };
    }
  }
  try {
    const result = await analyzeFoodWithGemini(db, text, oilPercentage, false, profileId);
    if (!isValidAnalysis(result)) throw new Error('Invalid nutrition estimate');
    return { result, source: 'gemini' };
  } catch (error) {
    if (forceGemini) throw error;
    const result = analyzeFoodLocally(text, oilPercentage);
    await recordAnalysisUsage(db, 'fallback', undefined, profileId).catch(() => {});
    return { result, source: 'fallback' };
  }
}

export async function rememberTextMeal(
  db: SQLiteDatabase,
  text: string,
  oilPercentage: number,
  analysis: TextMealAnalysis | null,
  profileId = 1
): Promise<void> {
  if (analysis?.source === 'gemini' || analysis?.source === 'cache') {
    // Meal logging has already succeeded. A cache failure must not undo it or encourage a duplicate log.
    await cacheConfirmedMeal(db, text, oilPercentage, analysis.result, profileId).catch(() => {});
  }
}
