import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { getPersonalApiKey, savePersonalApiKey, removePersonalApiKey } from '../services/ApiKeyService';
import { HAS_DEFAULT_GEMINI_KEYS } from '../services/GeminiFoodAnalysisService';
import GeminiUsageSettings from './GeminiUsageSettings';
import { useActiveProfileId } from '../hooks/useSettings';

export default function ApiKeySettings() {
  const profileId = useActiveProfileId();
  const [key, setKey] = useState('');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    getPersonalApiKey(profileId).then(value => setConnected(!!value))
      .catch(() => setMessage('Could not read your saved key. Please try again.'))
      .finally(() => setBusy(false));
  }, [profileId]);

  async function save() {
    setBusy(true);
    try {
      await savePersonalApiKey(key, profileId);
      setKey(''); setConnected(true);
      setMessage('Key saved. Your next AI analysis will use it.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save key.');
    } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try {
      await removePersonalApiKey(profileId); setConnected(false); setKey('');
      setMessage(HAS_DEFAULT_GEMINI_KEYS ? 'Personal key removed. JC will use its default keys.' : 'Personal key removed. Local estimates are available.');
    } catch { setMessage('Could not remove key. Please try again.'); }
    finally { setBusy(false); }
  }
  return (
    <>
      {connected !== null && <GeminiUsageSettings key={connected ? 'personal' : 'default'}
        scope={connected ? 'personal' : 'default'} keyConfigured={connected || HAS_DEFAULT_GEMINI_KEYS} />}
    <View style={{ gap: 10, padding: 16, borderRadius: 20, backgroundColor: 'rgba(10,132,255,0.08)' }}>
      <Text variant="titleMedium">Connect your Gemini key (optional)</Text>
      <Text>{connected ? 'Your personal key is selected.' : HAS_DEFAULT_GEMINI_KEYS
        ? 'JC uses its default keys until you connect a personal key.'
        : 'You can use local estimates or connect a key for Gemini analysis.'}</Text>
      <Text>1. Open Google AI Studio and sign in. Accept its terms if asked.</Text>
      <Text>2. Open API keys, then create or select a key and copy it. If asked, create or select a project.</Text>
      <Text>3. Paste it below and save. Availability and free usage limits depend on Google.</Text>
      <Button onPress={async () => {
        try { await Linking.openURL('https://aistudio.google.com/apikey'); }
        catch { setMessage('Could not open AI Studio. Visit aistudio.google.com/apikey in your browser.'); }
      }}>Open Google AI Studio</Button>
      <TextInput label={connected ? 'Replace personal API key' : 'Personal API key'} value={key} onChangeText={setKey}
        secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!busy} mode="outlined" />
      <Button mode="contained" onPress={save} loading={busy} disabled={busy || !key.trim()}>Save API key</Button>
      {connected && <Button onPress={remove} disabled={busy}>Remove key and use JC defaults</Button>}
      <Text variant="bodySmall">{Platform.OS === 'web' ? 'Browser preview: your key is kept only until the page reloads.' : 'Your key is stored securely on this device.'} Saving does not make an API request; your next analysis checks whether it works. If it fails, JC uses a local estimate rather than switching to its default keys.</Text>
      {!!message && <Text accessibilityLiveRegion="polite">{message}</Text>}
    </View>
    </>
  );
}
