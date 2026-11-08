import type { SQLiteDatabase } from 'expo-sqlite';
import type { FoodAnalysisResult } from '../types';

export function normalizeMealDescription(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hasValidNutrition(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const { calories, protein, carbs, fat } = value as FoodAnalysisResult;
  return [calories, protein, carbs, fat].every(amount => Number.isFinite(amount) && amount >= 0);
}

export function isValidAnalysis(result: unknown): result is FoodAnalysisResult {
  if (!hasValidNutrition(result)) return false;
  const { foodItems } = result as FoodAnalysisResult;
  return Array.isArray(foodItems) && foodItems.length > 0 && foodItems.every(item =>
    item && hasValidNutrition(item) &&
    typeof item.name === 'string' && item.name.trim().length > 0 &&
    typeof item.quantity === 'string' &&
    (item.preparation === null || typeof item.preparation === 'string') &&
    Number.isFinite(item.estimatedWeightGrams) && item.estimatedWeightGrams >= 0 &&
    (item.isRaw === undefined || typeof item.isRaw === 'boolean')
  );
}

export async function getCachedMeal(
  db: SQLiteDatabase,
  foodText: string,
  oilPercentage: number,
  profileId = 1
): Promise<FoodAnalysisResult | null> {
  const description = normalizeMealDescription(foodText);
  const row = await db.getFirstAsync<{ id: number; result: string }>(
    'SELECT id, result FROM meal_analysis_cache WHERE profileId = ? AND description = ? AND oilPercentage = ?',
    profileId, description, oilPercentage
  );
  if (!row) return null;

  let result: unknown;
  try {
    result = JSON.parse(row.result);
  } catch {
    return null;
  }
  if (!isValidAnalysis(result)) return null;

  await db.runAsync(
    `UPDATE meal_analysis_cache SET lastUsed = (SELECT MAX(lastUsed) + 1 FROM meal_analysis_cache WHERE profileId = ?)
     WHERE id = ? AND profileId = ? AND description = ? AND oilPercentage = ?`,
    profileId, row.id, profileId, description, oilPercentage
  );
  return result;
}

export async function cacheConfirmedMeal(
  db: SQLiteDatabase,
  foodText: string,
  oilPercentage: number,
  result: FoodAnalysisResult,
  profileId = 1
): Promise<void> {
  const description = normalizeMealDescription(foodText);
  if (!description || !Number.isFinite(oilPercentage) || !isValidAnalysis(result)) return;

  // Bound the encoded payload, including the copy of the description in the unique index.
  // Replacement and eviction run in the same SQLite statement.
  await db.runAsync(
    `WITH candidate(profileId, description, oilPercentage, result) AS (VALUES (?, ?, ?, ?))
     INSERT OR REPLACE INTO meal_analysis_cache (profileId, description, oilPercentage, result, lastUsed)
     SELECT profileId, description, oilPercentage, result,
       (SELECT COALESCE(MAX(lastUsed), 0) + 1 FROM meal_analysis_cache WHERE profileId = candidate.profileId)
     FROM candidate
     WHERE 2 * length(CAST(description AS BLOB)) + length(CAST(result AS BLOB)) <= 1536`,
    profileId, description, oilPercentage, JSON.stringify(result)
  );
}
