import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingCheck } from '../hooks/useSettings';
import { useSQLiteContext } from 'expo-sqlite';
import { getUserSettings } from '../database/DatabaseService';
import { BG_BASE, COLOR_PRIMARY } from '../constants/colors';

export default function Index() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { loading, onboardingComplete } = useOnboardingCheck();

  useEffect(() => {
    if (loading) return;

    async function checkSettings() {
      const settings = await getUserSettings(db);
      if (onboardingComplete && settings) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }

    checkSettings();
  }, [loading, onboardingComplete, db, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLOR_PRIMARY} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_BASE,
  },
});
