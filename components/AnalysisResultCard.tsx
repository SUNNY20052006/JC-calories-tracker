import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, type ReactNode } from 'react';
import { FoodAnalysisResult, FoodItem, MealNutrition, NutritionTargets } from '../types';
import { RAW_COOKED_RATIOS } from '../constants/foodDatabase';
import FoodItemCard from './FoodItemCard';
import MealAnalysisNotice from './MealAnalysisNotice';
import MealMacroFields from './MealMacroFields';
import type { TextMealAnalysis } from '../services/TextMealAnalysisService';
import { TEXT_PRIMARY } from '../constants/colors';
import { RADIUS_XL } from '../constants/radius';
import { TITLE, HEADING } from '../constants/typography';
import type { TargetDraft, TargetField } from '../utils/nutritionTargets';

interface Props {
  result: FoodAnalysisResult | null;
  total: MealNutrition;
  draft: TargetDraft | null;
  targets: NutritionTargets | null;
  onEditTotal: (field: TargetField, value: string) => void;
  onEditItem?: (index: number, item: FoodItem) => void;
  source?: TextMealAnalysis['source'];
  onRefresh: () => void;
  refreshDisabled: boolean;
  children?: ReactNode;
}

function findRatioKey(name: string): string | null {
  const lower = name.toLowerCase();
  for (const key of Object.keys(RAW_COOKED_RATIOS)) {
    if (lower.includes(key)) return key;
  }
  return null;
}

export default function AnalysisResultCard({ result, total, draft, targets, onEditTotal, onEditItem, source, onRefresh, refreshDisabled, children }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      hasAnimated.current = true;
    }
  }, []);

  function handleToggleRaw(index: number) {
    if (!onEditItem || !result) return;
    const item = { ...result.foodItems[index] };
    const key = findRatioKey(item.name);
    if (!key) return;

    const ratio = RAW_COOKED_RATIOS[key];
    const wasRaw = item.isRaw;
    const factor = wasRaw ? 1 / ratio : ratio;

    item.isRaw = !wasRaw;
    item.calories = Math.round(item.calories * factor);
    item.protein = parseFloat((item.protein * factor).toFixed(1));
    item.carbs = parseFloat((item.carbs * factor).toFixed(1));
    item.fat = parseFloat((item.fat * factor).toFixed(1));
    item.name = item.isRaw ? `${item.name} (raw)` : item.name.replace(/ \(raw\)$/, '');

    onEditItem(index, item);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.blueGlow} />
      <View style={styles.depthShadow}>
        <View style={styles.card}>
          <View style={styles.baseGlass} />
          <View style={styles.subtleTint} />
          <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent'] as const} style={styles.refraction} />
          <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
            <Text style={styles.sectionTitle}>Analysis Result</Text>

            {source && <MealAnalysisNotice source={source} onRefresh={onRefresh} disabled={refreshDisabled} />}
            <MealMacroFields original={total} draft={draft} targets={targets} onChange={onEditTotal}
              disabled={refreshDisabled} />

            {!!result?.foodItems.length && <>
              <View style={styles.divider} />
              <Text style={styles.itemsTitle}>Food Items</Text>
            </>}
            {result?.foodItems.map((item, index) => (
              <FoodItemCard
                key={index}
                item={item}
                onToggleRaw={findRatioKey(item.name) ? () => handleToggleRaw(index) : undefined}
                translucent
              />
            ))}
            {children}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  blueGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS_XL,
    backgroundColor: 'rgba(10,132,255,0.01)',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.26,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  depthShadow: {
    borderRadius: RADIUS_XL,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  card: {
    borderRadius: RADIUS_XL,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  baseGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  subtleTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,132,255,0.02)',
  },
  refraction: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    ...TITLE,
    color: TEXT_PRIMARY,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  itemsTitle: {
    ...HEADING,
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    fontFamily: 'StackSansNotch_600SemiBold',
  },
});
