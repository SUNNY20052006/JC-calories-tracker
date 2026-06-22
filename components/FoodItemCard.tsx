import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { FoodItem } from '../types';
import { BG_SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, COLOR_PRIMARY, COLOR_BORDER, COLOR_BORDER_SUBTLE, MACRO_CALORIES, MACRO_PROTEIN, MACRO_CARBS, MACRO_FAT, ACTIVE_PILL_BG, OUTLINED_BTN_BG } from '../constants/colors';
import { RADIUS_SM } from '../constants/radius';
import { BODY_EMPHASIS, CAPTION, MACRO_CHIP_VAL, MACRO_CHIP_LBL } from '../constants/typography';

interface Props {
  item: FoodItem;
  onToggleRaw?: () => void;
  translucent?: boolean;
}

export default function FoodItemCard({ item, onToggleRaw, translucent }: Props) {
  const subtitle = [
    item.quantity && `${item.quantity}`,
    item.preparation && `(${item.preparation})`,
    `${item.estimatedWeightGrams}g`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.card, translucent && styles.cardTranslucent]}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{item.name}</Text>
        {onToggleRaw && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={!item.isRaw ? onToggleRaw : undefined}
              style={[styles.toggleChip, item.isRaw && styles.toggleChipActive]}
            >
              <Text style={[styles.toggleText, item.isRaw && styles.toggleTextActive]}>Raw</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={item.isRaw ? onToggleRaw : undefined}
              style={[styles.toggleChip, !item.isRaw && styles.toggleChipActive]}
            >
              <Text style={[styles.toggleText, !item.isRaw && styles.toggleTextActive]}>Cooked</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.nutrients}>
        <NutrientChip macro="calories" value={item.calories} />
        <NutrientChip macro="protein" value={item.protein} />
        <NutrientChip macro="carbs" value={item.carbs} />
        <NutrientChip macro="fat" value={item.fat} />
      </View>
    </View>
  );
}

const MACRO_COLORS = {
  calories: MACRO_CALORIES,
  protein: MACRO_PROTEIN,
  carbs: MACRO_CARBS,
  fat: MACRO_FAT,
} as const;

function NutrientChip({ macro, value }: { macro: keyof typeof MACRO_COLORS; value: number }) {
  const color = MACRO_COLORS[macro];
  return (
    <View style={[styles.chip, { backgroundColor: color + '15' }]}>
      <Text style={[styles.chipValue, { color }]}>{Math.round(value)}</Text>
      <Text style={[styles.chipLabel, { color }]}>{macro === 'calories' ? 'kcal' : 'g'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG_SURFACE,
    borderRadius: RADIUS_SM,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLOR_BORDER_SUBTLE,
  },
  cardTranslucent: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...BODY_EMPHASIS,
    color: TEXT_PRIMARY,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  toggleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS_SM,
  },
  toggleChipActive: {
    backgroundColor: ACTIVE_PILL_BG,
    borderWidth: 1,
    borderColor: COLOR_PRIMARY,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_SECONDARY,
    fontFamily: 'StackSansNotch_500Medium',
  },
  toggleTextActive: {
    color: COLOR_PRIMARY,
    fontWeight: '600',
    fontFamily: 'StackSansNotch_600SemiBold',
  },
  subtitle: {
    ...CAPTION,
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  nutrients: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS_SM,
  },
  chipValue: {
    ...MACRO_CHIP_VAL,
  },
  chipLabel: {
    ...MACRO_CHIP_LBL,
    opacity: 0.8,
  },
});
