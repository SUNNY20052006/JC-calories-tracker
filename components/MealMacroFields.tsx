import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { BG_SURFACE, COLOR_BORDER, MACRO_CALORIES, MACRO_CARBS, MACRO_FAT, MACRO_PROTEIN } from '../constants/colors';
import type { MealNutrition, NutritionTargets } from '../types';
import { mealNutritionToDraft, readMealNutrition, type TargetDraft, type TargetField } from '../utils/nutritionTargets';
import MacroBreakdown from './MacroBreakdown';

const fields = [
  { field: 'dailyCalories', label: 'Calories', color: MACRO_CALORIES },
  { field: 'proteinTarget', label: 'Protein', color: MACRO_PROTEIN },
  { field: 'carbTarget', label: 'Carbs', color: MACRO_CARBS },
  { field: 'fatTarget', label: 'Fat', color: MACRO_FAT },
] as const;

interface Props {
  original: MealNutrition;
  draft: TargetDraft | null;
  targets: NutritionTargets | null;
  onChange: (field: TargetField, value: string) => void;
  disabled?: boolean;
}

export default function MealMacroFields({ original, draft, targets, onChange, disabled }: Props) {
  const values = draft ?? mealNutritionToDraft(original);
  const { nutrition, error } = readMealNutrition(draft, original);
  return (
    <View style={styles.container}>
      <MacroBreakdown nutrition={nutrition ?? original} targets={targets} />
      <View style={styles.row}>
        {fields.map(({ field, label, color }) => (
          <View key={field} style={styles.field}>
            <Text variant="labelSmall" style={[styles.label, { color }]}>{label}</Text>
            <TextInput mode="outlined" accessibilityLabel={label} keyboardType="decimal-pad"
              value={values[field]} editable={!disabled}
              onChangeText={value => onChange(field, value)}
              style={styles.input} contentStyle={styles.inputContent} outlineColor={COLOR_BORDER} />
          </View>
        ))}
      </View>
      {error && fields.every(({ field }) => values[field].trim()) && (
        <Text variant="bodySmall" style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', gap: 6 },
  field: { flex: 1, minWidth: 0 },
  label: { textAlign: 'center' },
  input: { height: 40, fontSize: 14, backgroundColor: BG_SURFACE },
  inputContent: { textAlign: 'center', paddingHorizontal: 4 },
  error: { color: '#FF9B92' },
});
