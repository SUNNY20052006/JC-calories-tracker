import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useOnboardingCheck } from '../hooks/useSettings';
import { updateSettings } from '../database/DatabaseService';
import LiquidGlassButton from '../components/LiquidGlassButton';

export default function Onboarding() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { markComplete } = useOnboardingCheck();
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('60');
  const [carbs, setCarbs] = useState('250');
  const [fat, setFat] = useState('65');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!calories || isNaN(Number(calories)) || Number(calories) <= 0) newErrors.calories = 'Enter a valid calorie target';
    if (!protein || isNaN(Number(protein)) || Number(protein) <= 0) newErrors.protein = 'Enter a valid protein target';
    if (!carbs || isNaN(Number(carbs)) || Number(carbs) <= 0) newErrors.carbs = 'Enter a valid carb target';
    if (!fat || isNaN(Number(fat)) || Number(fat) <= 0) newErrors.fat = 'Enter a valid fat target';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    await updateSettings(db, { dailyCalories: Number(calories), proteinTarget: Number(protein), carbTarget: Number(carbs), fatTarget: Number(fat) });
    await markComplete();
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" nestedScrollEnabled>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to JC</Text>
          <Text style={styles.subtitle}>Set your daily nutrition targets to get started.</Text>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Daily Calories</Text>
              <TextInput mode="outlined" value={calories} onChangeText={setCalories} keyboardType="numeric" error={!!errors.calories} style={styles.input} outlineStyle={styles.inputOutline} />
              {errors.calories && <Text style={styles.error}>{errors.calories}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Protein Target</Text>
              <TextInput mode="outlined" value={protein} onChangeText={setProtein} keyboardType="numeric" error={!!errors.protein} style={styles.input} outlineStyle={styles.inputOutline} />
              {errors.protein && <Text style={styles.error}>{errors.protein}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carbs Target</Text>
              <TextInput mode="outlined" value={carbs} onChangeText={setCarbs} keyboardType="numeric" error={!!errors.carbs} style={styles.input} outlineStyle={styles.inputOutline} />
              {errors.carbs && <Text style={styles.error}>{errors.carbs}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fat Target</Text>
              <TextInput mode="outlined" value={fat} onChangeText={setFat} keyboardType="numeric" error={!!errors.fat} style={styles.input} outlineStyle={styles.inputOutline} />
              {errors.fat && <Text style={styles.error}>{errors.fat}</Text>}
            </View>

            <LiquidGlassButton variant="primary" size="lg" onPress={handleSave}>
              Get Started
            </LiquidGlassButton>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0C0C0E' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  content: { alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8, color: '#FFFFFF', fontFamily: 'StackSansNotch_700Bold' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#98989D', marginBottom: 32, lineHeight: 22, paddingHorizontal: 16, fontFamily: 'StackSansNotch_400Regular' },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 6, fontFamily: 'StackSansNotch_600SemiBold' },
  input: { backgroundColor: '#2C2C2E', fontSize: 15, color: '#FFFFFF' },
  inputOutline: { borderRadius: 12, borderColor: 'rgba(84,84,88,0.65)' },
  error: { color: '#FF453A', fontSize: 12, marginTop: 4, fontFamily: 'StackSansNotch_400Regular' },

});
