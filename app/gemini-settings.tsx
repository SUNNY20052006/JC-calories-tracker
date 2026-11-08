import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ApiKeySettings from '../components/ApiKeySettings';
import { BG_BASE } from '../constants/colors';

export default function GeminiSettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <ApiKeySettings />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_BASE },
  content: { paddingHorizontal: 16, paddingTop: 12 },
});
