import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { FoodAnalysisResult, NutritionTargets } from '../types';
import { MACRO_CALORIES, MACRO_CARBS, MACRO_FAT, MACRO_PROTEIN, TEXT_SECONDARY } from '../constants/colors';
import ProgressDial from './ProgressDial';

type Nutrition = Omit<FoodAnalysisResult, 'foodItems'>;

const nutrients = [
  { key: 'calories', target: 'dailyCalories', label: 'Calories', unit: 'kcal', color: MACRO_CALORIES },
  { key: 'protein', target: 'proteinTarget', label: 'Protein', unit: 'g', color: MACRO_PROTEIN },
  { key: 'carbs', target: 'carbTarget', label: 'Carbs', unit: 'g', color: MACRO_CARBS },
  { key: 'fat', target: 'fatTarget', label: 'Fat', unit: 'g', color: MACRO_FAT },
] as const;

const formatAmount = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export default function MacroBreakdown({ nutrition, targets }: { nutrition: Nutrition; targets: NutritionTargets | null }) {
  return (
    <View style={styles.breakdown}>
      <Text variant="bodySmall" style={styles.muted}>Share of daily targets</Text>
      <View style={styles.row}>
        {nutrients.map(({ key, target, label, unit, color }) => {
          const amount = nutrition[key];
          const dailyTarget = targets?.[target] ?? 0;
          const progress = dailyTarget > 0 ? amount / dailyTarget : 0;
          const percent = dailyTarget > 0 ? `${Math.round(progress * 100)}%` : null;
          const value = `${formatAmount.format(amount)} ${unit}`;
          return (
            <View key={key} style={styles.item} accessible
              accessibilityLabel={`${label}, ${value}${percent ? `, ${percent} of daily target` : ', no daily target'}`}>
              <ProgressDial progress={progress} color={color} radius={20} strokeWidth={3}>
                <Text style={[styles.percent, { color }]} numberOfLines={1} adjustsFontSizeToFit>{percent ?? '—'}</Text>
              </ProgressDial>
              <Text variant="labelSmall" style={styles.muted}>{label}</Text>
              <Text variant="labelMedium" style={styles.amount}>{value}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  breakdown: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  item: { flexGrow: 1, flexBasis: '25%', minWidth: 54, alignItems: 'center', gap: 2 },
  percent: { fontSize: 12, fontWeight: '700', maxWidth: 38, textAlign: 'center' },
  muted: { color: TEXT_SECONDARY },
  amount: { textAlign: 'center' },
});
