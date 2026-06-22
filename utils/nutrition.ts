export function calculateOilAdjustedValues(
  baseCalories: number,
  baseProtein: number,
  baseCarbs: number,
  baseFat: number,
  oilPercentage: number
): { calories: number; protein: number; carbs: number; fat: number } {
  const oilDiff = (oilPercentage - 100) / 100;
  const extraOilGrams = Math.max(0, oilDiff) * 5;
  const extraFat = extraOilGrams * 9;
  const extraCalories = extraFat;

  return {
    calories: Math.round(baseCalories + extraCalories),
    protein: Math.round(baseProtein),
    carbs: Math.round(baseCarbs),
    fat: Math.round(baseFat + extraFat),
  };
}

export function getConfidenceLabel(
  text: string,
  hasExactMatch: boolean,
  matchQuality: 'exact' | 'close' | 'fallback'
): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  const hasExactWeight = /\d+\s*(g|gram|grams|ml|kg)\b/.test(lower);
  if (hasExactWeight && hasExactMatch) return 'high';

  const hasPortion = /\d+\s*(piece|slice|bowl|cup|plate|serving|glass|spoon|roti|chapati|egg|banana|apple)/.test(lower);
  if (hasExactMatch && hasPortion) return 'high';
  if (hasPortion) return 'medium';
  if (hasExactMatch) return 'medium';

  if (matchQuality === 'close') return 'low';

  return 'low';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function calculatePer100gMultiplier(
  originalCalories: number,
  originalProtein: number,
  originalCarbs: number,
  originalFat: number,
  weightGrams: number
): { calories: number; protein: number; carbs: number; fat: number } {
  const ratio = weightGrams / 100;
  return {
    calories: Math.round(originalCalories * ratio),
    protein: Math.round(originalProtein * ratio),
    carbs: Math.round(originalCarbs * ratio),
    fat: Math.round(originalFat * ratio),
  };
}
