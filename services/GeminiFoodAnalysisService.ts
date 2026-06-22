import { FoodAnalysisResult } from '../types';

const RAW_KEYS = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const API_KEYS = RAW_KEYS.split(',').map((k: string) => k.trim()).filter(Boolean);
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
let nextKeyIndex = 0;

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
  foodText: string,
  oilPercentage: number
): Promise<FoodAnalysisResult> {
  if (API_KEYS.length === 0) {
    throw new Error('Gemini API key not configured');
  }

  console.warn(`[Gemini] ${API_KEYS.length} keys loaded, starting at index ${nextKeyIndex}`);

  const prompt = buildPrompt(foodText, oilPercentage);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const keyIndex = (nextKeyIndex + attempt) % API_KEYS.length;
    const key = API_KEYS[keyIndex];
    const masked = key.slice(0, 8) + '...';

    console.warn(`[Gemini] Trying key index ${keyIndex} (${masked})`);

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
      console.warn(`[Gemini] Key ${keyIndex} succeeded, next start will be ${(keyIndex + 1) % API_KEYS.length}`);
      nextKeyIndex = (keyIndex + 1) % API_KEYS.length;
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

    const errorText = await response.text();
    console.warn(`[Gemini] Key ${keyIndex} failed: ${response.status} — ${errorText.slice(0, 120)}`);
    lastError = new Error(`Gemini API error (${response.status}): ${errorText}`);
    continue;
  }

  console.warn(`[Gemini] All ${API_KEYS.length} keys exhausted`);
  throw lastError || new Error('All Gemini API keys exhausted');
}
