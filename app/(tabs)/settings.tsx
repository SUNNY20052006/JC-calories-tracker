import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, List, Snackbar, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassActionButton from '../../components/GlassActionButton';
import NutritionTargetFields from '../../components/NutritionTargetFields';
import SwipeableTabScreen from '../../components/SwipeableTabScreen';
import { useUserSettings } from '../../hooks/useSettings';
import { BG_BASE, BG_SURFACE, COLOR_BORDER, TEXT_SECONDARY } from '../../constants/colors';
import { SCREEN_PADDING_H } from '../../constants/spacing';
import { EMPTY_TARGETS, readTargets, targetsToDraft, updateTargetDraft } from '../../utils/nutritionTargets';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, loading, save } = useUserSettings();
  const [draft, setDraft] = useState(EMPTY_TARGETS);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (settings) setDraft(targetsToDraft(settings));
  }, [settings]);

  async function handleSave() {
    if (saving) return;
    setSubmitted(true);
    const { targets } = readTargets(draft);
    if (!targets) return;
    setSaving(true);
    try {
      await save(targets);
      setSubmitted(false);
      setMessage('Nutrition targets saved.');
    } catch {
      setMessage('Could not save your targets. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SwipeableTabScreen>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive"
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 }]}>
          <Text variant="headlineMedium">Settings</Text>

          {settings && <View style={styles.linkCard}>
            <List.Item title={settings.displayName || 'Profile'} description="Profile on this device"
              accessibilityRole="button"
              left={props => <List.Icon {...props} icon="account-outline" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/profile')} />
          </View>}

          <View style={styles.linkCard}>
            <List.Item title="Gemini" description="API keys, usage, and daily request limit"
              accessibilityRole="button"
              left={props => <List.Icon {...props} icon="key-outline" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/gemini-settings')} />
          </View>

          <View style={styles.card}>
            <Text variant="titleMedium">Daily nutrition targets</Text>
            {loading ? <ActivityIndicator /> : (
              <>
                <NutritionTargetFields draft={draft} submitted={submitted} disabled={saving}
                  onChange={(field, value) => setDraft(current => updateTargetDraft(current, field, value))} />
                <GlassActionButton kind="primary" onPress={handleSave} loading={saving} disabled={saving}>
                  Save targets
                </GlassActionButton>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text variant="titleMedium">About JC</Text>
            <Text variant="bodySmall" style={styles.muted}>Meals and targets are stored on this device.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar visible={!!message} onDismiss={() => setMessage('')} duration={2500}>{message}</Snackbar>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_BASE },
  container: { paddingHorizontal: SCREEN_PADDING_H, gap: 16 },
  card: { padding: 16, gap: 12, borderRadius: 18, backgroundColor: BG_SURFACE, borderWidth: 1, borderColor: COLOR_BORDER },
  linkCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: BG_SURFACE, borderWidth: 1, borderColor: COLOR_BORDER },
  muted: { color: TEXT_SECONDARY },
});
