import { PORTION_DATABASE } from '../constants/portionDatabase';
import { FOOD_DATABASE } from '../constants/foodDatabase';
import { FoodItem, LocalFoodEntry } from '../types';

function capitalise(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function resolveGramsPerUnit(unit: string, foodHint: string): number {
  const rule = PORTION_DATABASE.find(
    r =>
      r.unit === unit ||
      r.variants.some(v => v === unit || unit.startsWith(v))
  );

  if (!rule) return 100;

  if (rule.foodOverrides) {
    for (const [key, grams] of Object.entries(rule.foodOverrides)) {
      if (foodHint.includes(key)) return grams;
    }
  }

  return rule.defaultGrams;
}

interface MatchResult { entry: LocalFoodEntry; matchedAlias: string }

function matchFoodEntry(hint: string): MatchResult | null {
  const h = hint.toLowerCase().trim();

  // Collect every (entry, alias) pair where the alias appears as a whole-word
  // substring of h, then rank by alias length descending so the most specific
  // match wins.  "black coffee" (12 chars) beats "coffee" (6 chars).
  type Candidate = { entry: LocalFoodEntry; alias: string; score: number };
  const candidates: Candidate[] = [];

  for (const entry of FOOD_DATABASE) {
    for (const alias of entry.aliases) {
      const a = alias.toLowerCase();
      // Require the alias to appear as a whole token: preceded/followed by a
      // word boundary (space, start, end, punctuation) so "rice" inside
      // "rice cake" can only win if nothing longer also matches.
      const idx = h.indexOf(a);
      if (idx === -1) continue;

      const before = idx === 0 ? true : /[\s,;()]/.test(h[idx - 1]);
      const after  = idx + a.length === h.length ? true : /[\s,;()]/.test(h[idx + a.length]);
      if (!before || !after) continue;

      candidates.push({ entry, alias: a, score: a.length });
    }
  }

  if (candidates.length === 0) return null;

  // Longest alias wins (most specific match)
  candidates.sort((a, b) => b.score - a.score);
  return { entry: candidates[0].entry, matchedAlias: candidates[0].alias };
}

function formatQuantity(qty: number, unit: string): string {
  if (unit === 'piece' || unit === 'egg' || unit === 'banana' || unit === 'apple') {
    const count = qty === 1 ? '1 piece' : `${qty} pieces`;
    return count;
  }
  return `${qty} ${unit}`;
}

export function estimateFoodItems(
  foodText: string,
  oilPercentage: number
): FoodItem[] {
  const cleaned = foodText
    .toLowerCase()
    .replace(/\band\b/g, ',')
    .replace(/\bwith\b/g, ',')
    .replace(/\bplus\b/g, ',');

  const segments = cleaned.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const items: FoodItem[] = [];

  for (const segment of segments) {
    const unitMatch = segment.match(
      /^(\d+(?:\.\d+)?)\s*(pieces?|slices?|bowls?|cups?|plates?|servings?|portions?|helpings?|glasses?|tablespoons?|tbsp|teaspoons?|tsp|spoons?|rotis?|chapatt?is?|eggs?|bananas?|apples?|pcs?|nos?\.?)\s*(?:of\s+)?(.+)?$/i
    );

    let quantity: number;
    let unit: string;
    let foodHint: string;

    if (unitMatch) {
      quantity = parseFloat(unitMatch[1]);
      unit = unitMatch[2].toLowerCase();
      foodHint = (unitMatch[3] || segment).trim();
    } else {
      const simpleMatch = segment.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
      if (simpleMatch) {
        quantity = parseFloat(simpleMatch[1]);
        unit = 'piece';
        foodHint = simpleMatch[2].trim();
      } else {
        quantity = 1;
        unit = 'serving';
        foodHint = segment;
      }
    }

    const gramsPerUnit = resolveGramsPerUnit(unit, foodHint);
    const totalGrams = gramsPerUnit * quantity;
    const foodMatch = matchFoodEntry(foodHint);

    if (foodMatch) {
      const { entry: food } = foodMatch;
      const factor = totalGrams / 100;
      const oilMultiplier = oilPercentage / 100;
      const extraFatFromOil = food.fatPer100g > 2
        ? food.fatPer100g * factor * (oilMultiplier - 1) * 0.15
        : 0;
      const extraCalFromOil = extraFatFromOil * 9;

      // Preserve the user's full specific phrase (e.g. "black coffee", "chicken breast")
      // rather than collapsing to the generic DB entry name (e.g. "Coffee", "Chicken").
      const displayName = capitalise(foodHint.trim());

      items.push({
        name: displayName,
        preparation: null,
        quantity: formatQuantity(quantity, unit),
        estimatedWeightGrams: Math.round(totalGrams),
        calories: Math.round(food.caloriesPer100g * factor + extraCalFromOil),
        protein: parseFloat((food.proteinPer100g * factor).toFixed(1)),
        carbs: parseFloat((food.carbsPer100g * factor).toFixed(1)),
        fat: parseFloat((food.fatPer100g * factor + extraFatFromOil).toFixed(1)),
      });
    } else {
      const factor = totalGrams / 100;
      items.push({
        name: capitalise(foodHint),
        preparation: null,
        quantity: formatQuantity(quantity, unit),
        estimatedWeightGrams: Math.round(totalGrams),
        calories: Math.round(150 * factor),
        protein: parseFloat((5 * factor).toFixed(1)),
        carbs: parseFloat((20 * factor).toFixed(1)),
        fat: parseFloat((5 * factor).toFixed(1)),
      });
    }
  }

  return items;
}

export function sumFoodItems(items: FoodItem[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
