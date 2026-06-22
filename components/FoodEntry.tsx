import { View, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { TEXT_DISABLED } from '../constants/colors';
import { RADIUS_XL } from '../constants/radius';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export default function FoodEntry({ value, onChangeText }: Props) {
  return (
    <View style={styles.outContainer}>
      <View style={styles.depthShadow}>
        <View style={styles.card}>
          <View style={styles.baseGlass} />
          <View style={styles.subtleTint} />
          <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent'] as const} style={styles.refraction} />
          <View style={styles.content}>
            <Text style={styles.label}>What did you eat?</Text>
            <TextInput
              mode="flat"
              placeholder="e.g., 2 eggs and toast, rice and dal"
              placeholderTextColor={TEXT_DISABLED}
              value={value}
              onChangeText={onChangeText}
              multiline
              numberOfLines={3}
              style={styles.input}
              underlineColor="transparent"
              activeUnderlineColor="#0A84FF"
              textColor="#FFFFFF"
            />
            <Text style={styles.hint}>
              Describe what you ate in natural language. Include quantities if possible.
            </Text>
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
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'StackSansNotch_600SemiBold',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    fontSize: 15,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 12,
    borderRadius: 12,
  },
  hint: {
    fontSize: 12,
    color: '#98989D',
    marginTop: 6,
    lineHeight: 16,
    fontFamily: 'StackSansNotch_400Regular',
  },
});
