import { useCallback, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  estimateGeminiRequestsLeft, getAnalysisUsage, getGeminiDailyLimit, setGeminiDailyLimit,
  STARTER_GEMINI_DAILY_BUDGET,
  type AnalysisUsageSummary, type GeminiScope,
} from '../database/AnalysisUsage';
import { GEMINI_MODEL, hasReportedDailyQuotaReached } from '../services/GeminiFoodAnalysisService';
import { useActiveProfileId } from '../hooks/useSettings';

interface Props {
  scope: GeminiScope;
  keyConfigured: boolean;
}

export default function GeminiUsageSettings({ scope, keyConfigured }: Props) {
  const db = useSQLiteContext();
  const profileId = useActiveProfileId();
  const [usage, setUsage] = useState<AnalysisUsageSummary | null>(null);
  const [usageError, setUsageError] = useState(false);
  const [dailyQuotaReached, setDailyQuotaReached] = useState(false);
  const [limit, setLimit] = useState<number | null>(null);
  const [limitReady, setLimitReady] = useState(false);
  const [limitError, setLimitError] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    async function refreshUsage() {
      try {
        const [current, quotaReached] = await Promise.all([
          getAnalysisUsage(db, scope, undefined, profileId),
          hasReportedDailyQuotaReached(scope, undefined, profileId).catch(() => false),
        ]);
        if (active) {
          setUsage(current);
          setDailyQuotaReached(quotaReached);
          setUsageError(false);
        }
      } catch {
        if (active) setUsageError(true);
      }
    }
    void getGeminiDailyLimit(db, scope, profileId).then(saved => {
      if (!active) return;
      setLimit(saved);
      setDraft(saved === null ? '' : String(saved));
      setLimitReady(true);
      setLimitError(false);
    }).catch(() => {
      if (active) {
        setLimitReady(false);
        setLimitError(true);
        setMessage('Could not load the saved daily limit. Reopen Settings to retry.');
      }
    });
    void refreshUsage();
    const timer = setInterval(refreshUsage, 30000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshUsage();
    });
    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [db, profileId, scope]));

  async function saveLimit() {
    const text = draft.trim();
    const value = text ? Number(text) : null;
    if (text && (!/^\d+$/.test(text) || !Number.isSafeInteger(value) || Number(value) < 1)) {
      setMessage('Enter a positive whole number for requests per day.');
      return;
    }
    setSaving(true);
    try {
      await setGeminiDailyLimit(db, scope, value, profileId);
      setLimit(value);
      setDraft(value === null ? '' : String(value));
      setMessage(value === null ? 'Using JC’s starter budget.' : 'Daily limit saved.');
    } catch {
      setMessage('Could not save the daily limit. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const estimate = dailyQuotaReached || (!usageError && usage && limitReady)
    ? estimateGeminiRequestsLeft(usage?.requestsThisQuotaDay ?? 0, limit, dailyQuotaReached)
    : null;
  const draftValue = draft.trim();

  return (
    <View style={styles.card}>
      <Text variant="titleMedium">Gemini usage</Text>
      {keyConfigured ? (
        <>
          <Text variant="bodySmall">{scope === 'personal' ? 'Personal key usage on this device' : 'JC default keys on this device'}</Text>
          <Text variant="headlineSmall" accessibilityLiveRegion="polite">
            {estimate === null
              ? (usageError || limitError ? 'Could not load request estimate' : 'Loading request estimate…')
              : `${estimate} requests left today (estimated)`}
          </Text>
          {dailyQuotaReached && <Text>Gemini reported that this key’s project reached its daily request quota.</Text>}
          {limitReady && !dailyQuotaReached && <Text variant="bodySmall">
            {limit === null
              ? `Based on JC’s starter budget of ${STARTER_GEMINI_DAILY_BUDGET} requests per day. Your Google quota may differ.`
              : `Based on the ${limit}-request daily limit you entered.`}
          </Text>}
          {usage && !usageError && <Text>{usage.requestsThisQuotaDay} Gemini attempts recorded today</Text>}
          <Text variant="bodySmall">The estimate subtracts the attempts JC has recorded on this device, including retries. Daily counts reset at midnight Pacific time. Other apps, devices, and per-minute limits can affect what Google allows.</Text>
          <Text variant="bodySmall">
            Use the requests-per-day (RPD) limit for {GEMINI_MODEL} in AI Studio.
            {scope === 'personal'
              ? ' Personal keys used by this profile share a local counter. Update the limit if you switch projects.'
              : ' All JC default keys are counted together. Enter a combined budget only if they use separate projects.'}
          </Text>
          <Button onPress={() => {
            void Linking.openURL('https://aistudio.google.com/rate-limit').catch(() => setMessage('Could not open Google AI Studio.'));
          }}>View limits in Google AI Studio</Button>
          <TextInput mode="outlined" label="Daily request limit (RPD)" keyboardType="number-pad"
            placeholder={String(STARTER_GEMINI_DAILY_BUDGET)}
            value={draft} onChangeText={setDraft} editable={limitReady && !saving} />
          <Button mode="contained" loading={saving} disabled={!limitReady || saving || draftValue === (limit === null ? '' : String(limit))}
            onPress={saveLimit}>{!draftValue && limit !== null ? 'Use JC starter budget' : 'Save daily limit'}</Button>
          {!!message && <Text accessibilityLiveRegion="polite">{message}</Text>}
        </>
      ) : <Text>Connect a Gemini key below to set a daily limit and see an estimate.</Text>}
      <Text variant="titleSmall" style={styles.statsTitle}>Last 7 quota days for this profile</Text>
      {usageError ? <Text>Usage totals are unavailable. Reopen Settings to retry.</Text> : usage ? (
        <>
          <Text>Cache hits: {usage.cacheHits}</Text>
          <Text>Local calculations: {usage.localCalculations}</Text>
          <Text>Gemini request attempts: {usage.geminiRequests}</Text>
          <Text>Fallback estimates: {usage.fallbackEstimates}</Text>
        </>
      ) : <Text>Loading usage…</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, padding: 16, marginBottom: 16, borderRadius: 20, backgroundColor: 'rgba(10,132,255,0.08)' },
  statsTitle: { marginTop: 8 },
});
