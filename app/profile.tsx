import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMealDraft } from '../hooks/useMealDraft';
import { useUserSettings } from '../hooks/useSettings';
import { BG_BASE, BG_SURFACE, COLOR_BORDER, COLOR_ERROR, TEXT_SECONDARY } from '../constants/colors';
import { SCREEN_PADDING_H } from '../constants/spacing';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { settings, rename, signOut, deleteActiveProfile } = useUserSettings();
  const { clearRecipes } = useMealDraft();
  const [name, setName] = useState(settings?.displayName ?? '');
  const [busy, setBusy] = useState<'name' | 'logout' | 'delete' | null>(null);
  const [message, setMessage] = useState('');

  async function saveName() {
    if (busy || !name.trim()) return;
    Keyboard.dismiss();
    setBusy('name');
    setMessage('');
    try {
      await rename(name);
      setName(name.trim());
      setMessage('Name saved.');
    } catch {
      setMessage('Could not save your name. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  function confirmLogout() {
    Keyboard.dismiss();
    Alert.alert('Log out?', 'You can sign back in to this profile on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => {
        setBusy('logout');
        setMessage('');
        try {
          await signOut();
          clearRecipes();
        } catch {
          setMessage('Could not log out. Please try again.');
        } finally {
          setBusy(null);
        }
      } },
    ]);
  }

  function confirmDelete() {
    Keyboard.dismiss();
    Alert.alert('Delete profile?', 'This permanently removes this profile, its meals, recipes, targets, cached estimates, and personal API key from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete profile', style: 'destructive', onPress: async () => {
        setBusy('delete');
        setMessage('');
        try {
          await deleteActiveProfile();
          clearRecipes();
        } catch {
          setMessage('Could not delete your profile. Please try again.');
        } finally {
          setBusy(null);
        }
      } },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.card}>
          <Text variant="titleMedium">Your name</Text>
          <TextInput mode="outlined" label="Name" autoCapitalize="words" value={name} editable={!busy}
            onChangeText={value => { setName(value); setMessage(''); }} />
          <Button mode="contained" onPress={saveName} loading={busy === 'name'}
            disabled={!!busy || !name.trim() || name.trim() === settings?.displayName}>Save name</Button>
          {!!message && <Text variant="bodySmall" accessibilityLiveRegion="polite">{message}</Text>}
        </View>
        <View style={styles.card}>
          <Text variant="bodySmall" style={styles.muted}>Your profile and meals are stored on this device.</Text>
          <Button mode="outlined" icon="logout" onPress={confirmLogout} loading={busy === 'logout'} disabled={!!busy}>Log out</Button>
          <Button mode="outlined" icon="delete-outline" textColor={COLOR_ERROR} onPress={confirmDelete}
            loading={busy === 'delete'} disabled={!!busy}>Delete profile</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_BASE },
  content: { paddingHorizontal: SCREEN_PADDING_H, paddingTop: 12, gap: 16 },
  card: { padding: 16, gap: 12, borderRadius: 18, backgroundColor: BG_SURFACE, borderWidth: 1, borderColor: COLOR_BORDER },
  muted: { color: TEXT_SECONDARY },
});
