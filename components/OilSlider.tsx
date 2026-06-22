import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { MACRO_CALORIES, TEXT_DISABLED } from '../constants/colors';
import { RADIUS_XL } from '../constants/radius';
import { CAPTION_SMALL } from '../constants/typography';

interface Props {
  value: number;
  onValueChange: (value: number) => void;
}

const OIL_LABELS = ['No oil', 'Light', 'Normal', 'Oily', 'V.oily'];

function getOilLabel(val: number): string {
  if (val === 0) return OIL_LABELS[0];
  if (val <= 50) return OIL_LABELS[1];
  if (val <= 100) return OIL_LABELS[2];
  if (val <= 150) return OIL_LABELS[3];
  return OIL_LABELS[4];
}

export default function OilSlider({ value, onValueChange }: Props) {
  return (
    <View style={styles.outContainer}>
      <View style={styles.depthShadow}>
        <View style={styles.card}>
          <View style={styles.baseGlass} />
          <View style={styles.subtleTint} />
          <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent'] as const} style={styles.refraction} />
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.label}>Oil Level</Text>
              <Text style={styles.value}>{Math.round(value)}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={200}
              step={5}
              value={value}
              onValueChange={onValueChange}
              minimumTrackTintColor={MACRO_CALORIES}
              maximumTrackTintColor="rgba(255,255,255,0.12)"
              thumbTintColor={MACRO_CALORIES}
            />
            <View style={styles.labels}>
              {OIL_LABELS.map((label, i) => (
                <Text
                  key={label}
                  style={[
                    styles.labelItem,
                    getOilLabel(value) === label && styles.labelItemActive,
                  ]}
                >
                  {label}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'StackSansNotch_600SemiBold',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A84FF',
    fontFamily: 'StackSansNotch_700Bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  labelItem: {
    ...CAPTION_SMALL,
    color: '#636366',
  },
  labelItemActive: {
    color: '#0A84FF',
    fontWeight: '600',
  },
});
