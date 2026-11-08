import { FoodAnalysisResult } from '../types';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getGeminiQuotaDay, recordAnalysisUsage, type GeminiScope } from '../database/AnalysisUsage';
import { getPersonalApiKey } from './ApiKeyService';

// Native release builds use keys entered on the device. Node runs the offline benchmarks.
const RAW_KEYS = typeof __DEV__ !== 'undefined' && !__DEV__ ? '' : process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const API_KEYS = RAW_KEYS.split(',').map((k: string) => k.trim()).filter(Boolean);
export const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
export const HAS_DEFAULT_GEMINI_KEYS = API_KEYS.length > 0;
let nextKeyIndex = 0;
const reportedDailyQuota = new Map<number, { key: string; day: string }>();

export function forgetProfileQuota(profileId: number): void {
  reportedDailyQuota.delete(profileId);
}

export async function hasReportedDailyQuotaReached(scope: GeminiScope, at = new Date(), profileId = 1): Promise<boolean> {
  const quotaOwner = scope === 'personal' ? profileId : 0;
  const notice = reportedDailyQuota.get(quotaOwner);
  if (!notice || notice.day !== getGeminiQuotaDay(at)) return false;
  const key = scope === 'personal' ? await getPersonalApiKey(profileId) : API_KEYS[0];
  return key === notice.key && reportedDailyQuota.get(quotaOwner) === notice;
}

async function isDailyRequestQuotaError(response: Response): Promise<boolean> {
  try {
    const body: unknown = await response.json();
    const details = (body as { error?: { details?: unknown[] } } | null)?.error?.details;
    if (!Array.isArray(details)) return false;

    return details.some(value => {
      const detail = value as { '@type'?: unknown; violations?: unknown } | null;
      if (detail?.['@type'] !== 'type.googleapis.com/google.rpc.QuotaFailure' || !Array.isArray(detail.violations)) return false;

      return detail.violations.some((violation: {
        quotaId?: unknown;
        quotaDimensions?: { model?: unknown };
      } | null) => {
        const id = violation?.quotaId;
        const model = violation?.quotaDimensions?.model;
        return typeof id === 'string' &&
          /^GenerateRequestsPerDayPerProjectPerModel(?:-|$)/.test(id) &&
          (model === undefined || model === GEMINI_MODEL);
      });
    });
  } catch {
    return false;
  }
}

function buildPrompt(foodText: string, oilPercentage: number): string {
  return `Analyze the following food description and estimate nutritional values.

Food description: "${foodText}"
Oil level: ${oilPercentage}% (100% = normal, 200% = very oily)

IMPORTANT — You MUST:
1. Extract the EXACT FOOD NAME as consumed — preserve every meaningful modifier that affects nutrition.
   Good: "black coffee", "chicken breast", "chicken thigh", "brown rice", "fried rice", "rice cake", "whole milk", "skim milk", "greek yogurt", "peanut butter"
   BAD:  "coffee", "chicken", "rice", "milk", "yogurt", "peanuts"
   Rule: if the user said "black coffee" the name field MUST be "black coffee", not "coffee".
   Rule: if the user said "chicken breast" the name field MUST be "chicken breast", not "chicken".
   Rule: if the user said "rice cake" the name field MUST be "rice cake", not "rice".
2. Identify the PREPARATION METHOD (e.g., "grilled", "fried", "boiled", "roasted", "baked", "steamed", "tandoori", "curry", "butter", "creamy", "raw"). Set to null if not specified.
3. Extract the QUANTITY + UNIT — check if user gave exact weight ("300g"), portion count ("4 pieces", "3 eggs", "2 rotis", "1 bowl"), or vague description ("some", "a plate of")
4. Estimate weight in grams from portions (1 egg=50g, 1 roti=40g, 1 bowl rice=150g, 1 chicken piece=100g, 1 slice bread=30g, 1 fish piece=80g)

Return ONLY valid JSON, no markdown, no code fences:

{
  "foodItems": [
    {
      "name": "chicken breast",
      "preparation": "grilled",
      "quantity": "300g",
      "estimatedWeightGrams": 300,
      "calories": 561,
      "protein": 96,
      "carbs": 0,
      "fat": 13.5
    }
  ],
  "calories": 561,
  "protein": 96,
  "carbs": 0,
  "fat": 13.5
}

CRITICAL — Hallucination prevention (MUST follow):
- ONLY analyze what the user actually said. If they say "mixed vegetables", respond with a generic mixed vegetable estimate, NOT a completely different dish like pizza or burger.
- If the user says something vague or generic like "lunch", "had food", "snacks", respond with the generic description as the item name and use standard balanced meal macros (~500 cal, 20g protein, 60g carbs, 20g fat).
- NEVER change the food type to something unrelated. "Mix veg" → vegetable dish, NOT pizza. "Paneer" → paneer dish, NOT chicken.
- When in doubt, use a generic version of the category the user mentioned rather than guessing a specific dish.

RULES:
- Differentiate between chicken breast vs thigh, boiled vs fried egg, toned vs full cream milk
- For fried foods, add ~50% more fat vs the base version
- For creamy/butter dishes, add fat accordingly
- If the user gives exact weight (e.g., "300g chicken"), USE THAT WEIGHT exactly
- If the user gives portions (e.g., "4 pieces chicken"), estimate weight using standard portions
- If the user gives vague input (e.g., "had some chicken"), estimate a standard serving (~200g)
- Total must equal the sum of all food items
- All values must be realistic for the specified food and preparation method`;
}

export async function analyzeFoodWithGemini(
  db: SQLiteDatabase,
  foodText: string,
  oilPercentage: number,
  wholeRecipe: boolean = false,
  profileId = 1
): Promise<FoodAnalysisResult> {
  const personalKey = await getPersonalApiKey(profileId);
  const keys = personalKey ? [personalKey] : API_KEYS;
  const scope = personalKey ? 'personal' : 'default';
  const quotaOwner = personalKey ? profileId : 0;
  const startIndex = personalKey ? 0 : nextKeyIndex;
  if (keys.length === 0) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = buildPrompt(foodText, oilPercentage) + (wholeRecipe ? `
This is a WHOLE RECIPE, not a single serving. Return totals for ALL listed ingredients in the entire batch.
Keep ingredients associated with their recipe; "and" and "with" may join ingredients, not separate dishes.
Use specified ingredient amounts and specified oil exactly. Do not add oil twice.
Do not infer ingredients from gravy colour (orange-coloured gravy does not imply orange fruit).
If amounts are missing use reasonable assumptions; the user will review these estimates.` : '');
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (startIndex + attempt) % keys.length;
    const key = keys[keyIndex];

    // Count each dispatched attempt, including retry keys. Usage bookkeeping must not block analysis.
    const dispatchedAt = new Date();
    await recordAnalysisUsage(db, scope, dispatchedAt, profileId).catch(() => {});
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 1,
          topP: 1,
        },
      }),
    });

    if (response.ok) {
      if (reportedDailyQuota.get(quotaOwner)?.key === key) reportedDailyQuota.delete(quotaOwner);
      if (!personalKey) nextKeyIndex = (keyIndex + 1) % keys.length;
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response text from Gemini');
      }

      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error('Failed to parse Gemini response as JSON');
      }

      const rawItems: any[] = parsed.foodItems || parsed.food_items;
      if (!rawItems || !Array.isArray(rawItems)) {
        throw new Error('Invalid response structure: missing foodItems array');
      }

      const foodItems = rawItems.map((item: any) => {
        const nv = item.nutritional_values || item.nutritionalValues || item;
        return {
          name: item.name || item.food_name || 'Unknown',
          preparation: item.preparation || item.preparation_method || null,
          quantity: String(item.quantity || item.estimated_quantity || '1 serving'),
          estimatedWeightGrams: item.estimatedWeightGrams || item.estimated_weight_g || item.estimated_weight_grams || 100,
          calories: Math.round(nv.calories || item.calories || 0),
          protein: Math.round(nv.protein_g || nv.protein || item.protein || 0),
          carbs: Math.round(nv.carbohydrates_g || nv.carbohydrates || nv.carbs || item.carbs || 0),
          fat: Math.round(nv.fat_g || nv.fat || item.fat || 0),
        };
      });

      const totals = parsed.total_nutritional_values || parsed.totalNutritionalValues || parsed;
      return {
        foodItems,
        calories: Math.round(totals.calories || foodItems.reduce((s: number, f: any) => s + f.calories, 0)),
        protein: Math.round(totals.protein_g || totals.protein || foodItems.reduce((s: number, f: any) => s + f.protein, 0)),
        carbs: Math.round(totals.carbohydrates_g || totals.carbohydrates || totals.carbs || foodItems.reduce((s: number, f: any) => s + f.carbs, 0)),
        fat: Math.round(totals.fat_g || totals.fat || foodItems.reduce((s: number, f: any) => s + f.fat, 0)),
      };
    }

    // One rejected key says nothing about the remaining projects in a multi-key pool.
    if (keys.length === 1 && response.status === 429 && await isDailyRequestQuotaError(response)) {
      reportedDailyQuota.set(quotaOwner, { key, day: getGeminiQuotaDay(dispatchedAt) });
      lastError = new Error('Gemini reported that the daily request quota is exhausted.');
    } else {
      lastError = new Error(`Gemini API error (${response.status}). Check your key and quota in Settings.`);
    }
    continue;
  }

  throw lastError || new Error('All Gemini API keys exhausted');
}
