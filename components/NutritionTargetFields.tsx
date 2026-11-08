import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { readTargets, type TargetDraft, type TargetField } from '../utils/nutritionTargets';

const fields: { field: TargetField; label: string; unit: string }[] = [
  { field: 'dailyCalories', label: 'Calories', unit: 'kcal' },
  { field: 'proteinTarget', label: 'Protein', unit: 'g' },
  { field: 'carbTarget', label: 'Carbs', unit: 'g' },
  { field: 'fatTarget', label: 'Fat', unit: 'g' },
];

interface Props {
  draft: TargetDraft;
  onChange: (field: TargetField, value: string) => void;
  disabled?: boolean;
  submitted?: boolean;
}

export default function NutritionTargetFields({ draft, onChange, disabled, submitted }: Props) {
  const error = readTargets(draft).error;
  const showError = error && (submitted || fields.every(({ field }) => draft[field].trim()));
  return (
    <View style={styles.container}>
      <Text variant="bodySmall">Calories adjust carbs. Editing a macro recalculates calories.</Text>
      {fields.map(({ field, label, unit }) => (
        <TextInput
          key={field}
          label={`${label} (${unit})`}
          mode="outlined"
          keyboardType="decimal-pad"
          value={draft[field]}
          onChangeText={value => onChange(field, value)}
          editable={!disabled}
        />
      ))}
      {showError ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  error: { color: '#FF9B92' },
});
