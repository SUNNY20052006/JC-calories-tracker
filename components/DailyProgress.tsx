import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MACRO_CALORIES, MACRO_PROTEIN, MACRO_CARBS, MACRO_FAT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_DISABLED } from '../constants/colors';
import { RADIUS_XL } from '../constants/radius';
import { RING_VALUE, RING_LABEL } from '../constants/typography';

import ProgressDial from './ProgressDial';

interface Props {
  currentCalories: number;
  targetCalories: number;
  currentProtein: number;
  targetProtein: number;
  currentCarbs: number;
  targetCarbs: number;
  currentFat: number;
  targetFat: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export default function DailyProgress(props: Props) {
  const today = new Date();

  return (
    <View style={styles.outContainer}>
      <View style={styles.blueOuterGlow} />
      <View style={styles.depthShadow}>
        <View style={styles.card}>
          <View style={styles.baseGlass} />
          <View style={styles.subtleTint} />
          <View style={styles.innerShadow} />
          <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)', 'transparent'] as const} style={styles.topRefraction} />
          <View style={styles.contentLayer}>
            <View style={styles.header}>
              <Text style={styles.title}>Today</Text>
              <Text style={styles.date}>{formatDate(today)}</Text>
            </View>
            <View style={styles.ringRow}>
              <Ring current={props.currentCalories} target={props.targetCalories} label="Cal" color={MACRO_CALORIES} unit="kcal" radius={32} strokeWidth={5} />
              <Ring current={props.currentProtein} target={props.targetProtein} label="Pro" color={MACRO_PROTEIN} unit="g" radius={28} strokeWidth={4} />
              <Ring current={props.currentCarbs} target={props.targetCarbs} label="Crb" color={MACRO_CARBS} unit="g" radius={28} strokeWidth={4} />
              <Ring current={props.currentFat} target={props.targetFat} label="Fat" color={MACRO_FAT} unit="g" radius={28} strokeWidth={4} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function Ring({ current, target, label, color, unit, radius, strokeWidth }: {
  current: number;
  target: number;
  label: string;
  color: string;
  unit: string;
  radius: number;
  strokeWidth: number;
}) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const remaining = Math.max(0, target - current);
  const isOver = current >= target;

  return (
    <View style={styles.ringContainer}>
      <ProgressDial progress={progress} color={color} radius={radius} strokeWidth={strokeWidth} />
      <Text style={[styles.ringValue, { color }]}>
        {Math.round(current)}
        <Text style={[styles.ringUnit, { color }]}>{unit}</Text>
        {isOver && <Text style={[styles.overflow, { color }]}>!</Text>}
      </Text>
      <Text style={styles.ringLabel}>{label}</Text>
      {target > 0 && (
        <Text style={styles.ringRemaining}>{remaining}↓</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  blueOuterGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS_XL,
    backgroundColor: 'rgba(10,132,255,0.01)',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.28,
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
  innerShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  topRefraction: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentLayer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: TEXT_PRIMARY,
    fontFamily: 'StackSansNotch_700Bold',
  },
  date: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: TEXT_SECONDARY,
    fontFamily: 'StackSansNotch_500Medium',
  },
  ringRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  ringContainer: {
    alignItems: 'center',
    width: 76,
  },
  ringValue: {
    ...RING_VALUE,
    marginTop: 4,
  },
  ringUnit: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'StackSansNotch_600SemiBold',
  },
  overflow: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'StackSansNotch_600SemiBold',
  },
  ringLabel: {
    ...RING_LABEL,
    color: TEXT_SECONDARY,
    marginTop: 1,
  },
  ringRemaining: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    color: TEXT_DISABLED,
    marginTop: 1,
    fontFamily: 'StackSansNotch_400Regular',
  },
});
