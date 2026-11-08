import type { MealNutrition, NutritionTargets } from '../types';

export type TargetField = keyof NutritionTargets;
export type TargetDraft = Record<TargetField, string>;
export type ActivityLevel = 'inactive' | 'lowActive' | 'active' | 'veryActive';
export type EquationProfile = 'female' | 'male';

export const EMPTY_TARGETS: TargetDraft = { dailyCalories: '', proteinTarget: '', carbTarget: '', fatTarget: '' };

export function parseTarget(text: string): number | null {
  const value = text.trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d{0,4})?|\.\d{1,4})$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) && number <= 100000 ? number : null;
}

const formatTarget = (value: number) => String(Number(value.toFixed(4)));

export function targetsToDraft(targets: NutritionTargets): TargetDraft {
  return {
    dailyCalories: formatTarget(targets.dailyCalories),
    proteinTarget: formatTarget(targets.proteinTarget),
    carbTarget: formatTarget(targets.carbTarget),
    fatTarget: formatTarget(targets.fatTarget),
  };
}

export function updateTargetDraft(draft: TargetDraft, field: TargetField, value: string): TargetDraft {
  const next = { ...draft, [field]: value };
  const protein = parseTarget(next.proteinTarget);
  const fat = parseTarget(next.fatTarget);
  if (protein === null || fat === null) return next;
  const fixedCalories = protein * 4 + fat * 9;

  if (field === 'dailyCalories') {
    const calories = parseTarget(value);
    if (calories !== null && calories >= fixedCalories - 0.00001) {
      next.carbTarget = formatTarget(Math.max(0, (calories - fixedCalories) / 4));
    }
  } else {
    const carbs = parseTarget(next.carbTarget);
    if (carbs !== null) next.dailyCalories = formatTarget(fixedCalories + carbs * 4);
  }
  return next;
}

export function readTargets(draft: TargetDraft, allowZero = false): { targets: NutritionTargets; error?: never } | { targets?: never; error: string } {
  const dailyCalories = parseTarget(draft.dailyCalories);
  const proteinTarget = parseTarget(draft.proteinTarget);
  const carbTarget = parseTarget(draft.carbTarget);
  const fatTarget = parseTarget(draft.fatTarget);
  if (dailyCalories === null || proteinTarget === null || carbTarget === null || fatTarget === null || (!allowZero && dailyCalories === 0)) {
    return { error: allowZero ? 'Enter a non-negative number for calories and each macro.' : 'Enter a positive calorie target and a number for each macro.' };
  }
  const fixedCalories = proteinTarget * 4 + fatTarget * 9;
  if (dailyCalories < fixedCalories - 0.001) {
    return { error: `Protein and fat already account for ${formatTarget(fixedCalories)} kcal. Lower one of them or raise calories.` };
  }
  if (Math.abs(dailyCalories - (fixedCalories + carbTarget * 4)) > 0.001) {
    return { error: 'Edit calories or a macro to bring the values into balance.' };
  }
  return { targets: { dailyCalories, proteinTarget, carbTarget, fatTarget } };
}

export function mealNutritionToDraft({ calories, protein, carbs, fat }: MealNutrition): TargetDraft {
  return targetsToDraft({ dailyCalories: calories, proteinTarget: protein, carbTarget: carbs, fatTarget: fat });
}

export function readMealNutrition(draft: TargetDraft | null, original: MealNutrition): { nutrition: MealNutrition; error?: never } | { nutrition?: never; error: string } {
  if (!draft) return { nutrition: original };
  const { targets, error } = readTargets(draft, true);
  if (!targets) return { error };
  return { nutrition: { calories: targets.dailyCalories, protein: targets.proteinTarget, carbs: targets.carbTarget, fat: targets.fatTarget } };
}

// Adult EER coefficients, National Academies Dietary Reference Intakes for Energy (2023), Table 5-16.
// Tuple order is intercept, age, height in centimeters, weight in kilograms.
const adultEquations: Record<EquationProfile, Record<ActivityLevel, readonly [number, number, number, number]>> = {
  male: {
    inactive: [753.07, -10.83, 6.50, 14.10],
    lowActive: [581.47, -10.83, 8.30, 14.94],
    active: [1004.82, -10.83, 6.52, 15.91],
    veryActive: [-517.88, -10.83, 15.61, 19.11],
  },
  female: {
    inactive: [584.90, -7.01, 5.72, 11.71],
    lowActive: [575.77, -7.01, 6.60, 12.14],
    active: [710.25, -7.01, 6.54, 12.34],
    veryActive: [511.83, -7.01, 9.07, 12.56],
  },
};

export function estimateMaintenanceTargets(
  age: number,
  heightCm: number,
  weightKg: number,
  profile: EquationProfile,
  activity: ActivityLevel
): NutritionTargets | null {
  if (!Number.isInteger(age) || age < 19 || age > 120 ||
      !Number.isFinite(heightCm) || heightCm < 50 || heightCm > 300 ||
      !Number.isFinite(weightKg) || weightKg < 15 || weightKg > 500) return null;

  const [intercept, ageFactor, heightFactor, weightFactor] = adultEquations[profile][activity];
  const dailyCalories = Math.round(intercept + age * ageFactor + heightCm * heightFactor + weightKg * weightFactor);
  if (dailyCalories <= 0) return null;

  const proteinTarget = Math.round(dailyCalories * 0.2 / 4);
  const fatTarget = Math.round(dailyCalories * 0.3 / 9);
  const carbTarget = Math.max(0, (dailyCalories - proteinTarget * 4 - fatTarget * 9) / 4);
  return { dailyCalories, proteinTarget, carbTarget, fatTarget };
}
