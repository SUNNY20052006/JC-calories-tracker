import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSQLiteContext } from 'expo-sqlite';
import { UserSettings } from '../types';
import { getUserSettings, updateSettings } from '../database/DatabaseService';

const SETTINGS_KEY = '@jc_onboarding_complete';

export function useOnboardingCheck() {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const val = await AsyncStorage.getItem(SETTINGS_KEY);
        setOnboardingComplete(val === 'true');
      } catch {
        setOnboardingComplete(false);
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  const markComplete = useCallback(async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, 'true');
    setOnboardingComplete(true);
  }, []);

  return { loading, onboardingComplete, markComplete };
}

export function useUserSettings() {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const s = await getUserSettings(db);
      setSettings(s);
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const save = useCallback(
    async (data: {
      dailyCalories: number;
      proteinTarget: number;
      carbTarget: number;
      fatTarget: number;
    }) => {
      await updateSettings(db, data);
      await load();
    },
    [db, load]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { settings, loading, save, reload: load };
}
