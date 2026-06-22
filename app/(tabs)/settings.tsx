import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, ActivityIndicator, Snackbar } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import SwipeableTabScreen from '../../components/SwipeableTabScreen';
import GlassActionButton from '../../components/GlassActionButton';
import { useUserSettings } from '../../hooks/useSettings';
import { LinearGradient } from 'expo-linear-gradient';
import { BG_BASE, BG_SURFACE, COLOR_PRIMARY, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_DISABLED, COLOR_BORDER } from '../../constants/colors';
import { SCREEN_PADDING_H, SPACE_2, SPACE_24, SPACE_8 } from '../../constants/spacing';
import { RADIUS_SM, RADIUS_XL } from '../../constants/radius';
import { CAPTION, BODY } from '../../constants/typography';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { settings, loading, save, reload } = useUserSettings();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    if (settings) {
      setCalories(String(Math.round(settings.dailyCalories)));
      setProtein(String(Math.round(settings.proteinTarget)));
      setCarbs(String(Math.round(settings.carbTarget)));
      setFat(String(Math.round(settings.fatTarget)));
    }
  }, [settings]);

  async function handleSave() {
    if (!calories || !protein || !carbs || !fat) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    const c = Number(calories);
    const p = Number(protein);
    const ca = Number(carbs);
    const f = Number(fat);
    if ([c, p, ca, f].some((v) => isNaN(v) || v <= 0)) {
      Alert.alert('Error', 'All values must be positive numbers.');
      return;
    }
    setSaving(true);
    try {
      await save({ dailyCalories: c, proteinTarget: p, carbTarget: ca, fatTarget: f });
      setSnackbarVisible(true);
    } catch {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SwipeableTabScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_PRIMARY} />
        </View>
      </SwipeableTabScreen>
    );
  }

  return (
    <SwipeableTabScreen>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Nutrition Targets</Text>
            <View style={styles.cardWrapper}>
              <View style={styles.cardBlueGlow} />
              <View style={styles.cardDepth}>
                <View style={styles.card}>
                  <View style={styles.cardBase} />
                  <View style={styles.cardTint} />
                  <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent'] as const} style={styles.cardRefraction} />
                  <View>
                    <InputRow label="Calories" value={calories} onChange={setCalories} unit="kcal" />
                    <View style={styles.divider} />
                    <InputRow label="Protein" value={protein} onChange={setProtein} unit="g" />
                    <View style={styles.divider} />
                    <InputRow label="Carbs" value={carbs} onChange={setCarbs} unit="g" />
                    <View style={styles.divider} />
                    <InputRow label="Fat" value={fat} onChange={setFat} unit="g" />
                  </View>
                </View>
              </View>
            </View>
            <GlassActionButton kind="primary" onPress={handleSave} loading={saving} disabled={saving}>
              Save Settings
            </GlassActionButton>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.cardWrapper}>
              <View style={styles.cardBlueGlow} />
              <View style={styles.cardDepth}>
                <View style={styles.card}>
                  <View style={styles.cardBase} />
                  <View style={styles.cardTint} />
                  <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent'] as const} style={styles.cardRefraction} />
                  <View>
                    <View style={styles.aboutRow}>
                      <Text style={styles.aboutLabel}>App</Text>
                      <Text style={styles.aboutValue}>JC</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.aboutRow}>
                      <Text style={styles.aboutLabel}>Data</Text>
                      <Text style={styles.aboutValue}>Stored locally on device</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.aboutRow}>
                      <Text style={styles.aboutLabel}>Analysis</Text>
                      <Text style={styles.aboutValue}>Gemini API + Local DB</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
      >
        Saved
      </Snackbar>
    </SwipeableTabScreen>
  );
}

function InputRow({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRight}>
        <View style={styles.inputGlass}>
          <TextInput
            mode="flat"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            style={styles.inputField}
            underlineColor="transparent"
            activeUnderlineColor="#0A84FF"
            textColor="#FFFFFF"
          />
        </View>
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG_BASE },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG_BASE },
  container: { paddingHorizontal: SCREEN_PADDING_H, paddingTop: SPACE_8, paddingBottom: SPACE_24 },
  section: { marginBottom: 24 },
  sectionTitle: {
    ...CAPTION,
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
    marginLeft: 4,
  },
  cardWrapper: {
    borderRadius: RADIUS_XL,
  },
  cardBlueGlow: {
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
  cardDepth: {
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
  cardBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  cardTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,132,255,0.02)',
  },
  cardRefraction: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: 14,
  },
  inputLabel: {
    ...BODY,
    color: TEXT_PRIMARY,
  },
  inputRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_2,
  },
  inputGlass: {
    borderRadius: RADIUS_SM,
    backgroundColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  inputField: {
    minWidth: 80,
    maxWidth: 110,
    height: 36,
    backgroundColor: 'transparent',
    fontSize: 15,
    textAlign: 'right',
    color: '#FFFFFF',
  },
  inputUnit: {
    ...CAPTION,
    color: TEXT_SECONDARY,
    width: 30,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: SCREEN_PADDING_H,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingVertical: 13,
  },
  aboutLabel: {
    ...BODY,
    color: TEXT_PRIMARY,
  },
  aboutValue: {
    ...CAPTION,
    color: TEXT_SECONDARY,
  },
});
