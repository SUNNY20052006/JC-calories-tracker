import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { NutritionTargets, SavedProfile, UserSettings } from '../types';
import { completeProfileKeyRemoval, createProfile, deleteProfile, getProfileKeysToRemove, getSavedProfiles, getUserSettings, renameProfile, setProfileSignedOut, updateSettings } from '../database/DatabaseService';
import { removePersonalApiKey } from '../services/ApiKeyService';
import { forgetProfileQuota } from '../services/GeminiFoodAnalysisService';

interface SettingsContext {
  settings: UserSettings | null;
  profiles: SavedProfile[];
  loading: boolean;
  loadError: boolean;
  reload: () => Promise<void>;
  save: (data: NutritionTargets) => Promise<void>;
  signUp: (data: NutritionTargets, displayName: string) => Promise<void>;
  signIn: (id: number) => Promise<void>;
  signOut: () => Promise<void>;
  deleteActiveProfile: () => Promise<void>;
  rename: (displayName: string) => Promise<void>;
}

const Context = createContext<SettingsContext | null>(null);

async function removeDeletedProfileKey(db: SQLiteDatabase, id: number) {
  await removePersonalApiKey(id);
  await completeProfileKeyRemoval(db, id);
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [{ settings, profiles }, setSession] = useState<{ settings: UserSettings | null; profiles: SavedProfile[] }>({ settings: null, profiles: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    const [settings, profiles] = await Promise.all([getUserSettings(db), getSavedProfiles(db)]);
    setSession({ settings, profiles });
  }, [db]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    void reload();
    // Deletion is committed in SQLite first. Retry a SecureStore cleanup interrupted by an app exit.
    void getProfileKeysToRemove(db).then(pending => Promise.allSettled(
      pending.map(({ profileId }) => removeDeletedProfileKey(db, profileId))
    )).catch(() => {});
  }, [db, reload]);

  function activeId() {
    if (!settings) throw new Error('No active profile');
    return settings.id;
  }

  async function save(data: NutritionTargets) {
    await updateSettings(db, data, activeId());
    await refresh();
  }

  async function signUp(data: NutritionTargets, displayName: string) {
    await createProfile(db, data, displayName);
    await refresh();
  }

  async function signIn(id: number) {
    await setProfileSignedOut(db, id, false);
    await refresh();
  }

  async function signOut() {
    await setProfileSignedOut(db, activeId(), true);
    await refresh();
  }

  async function deleteActiveProfile() {
    const id = activeId();
    await deleteProfile(db, id);
    forgetProfileQuota(id);
    setSession(current => ({ settings: null, profiles: current.profiles.filter(profile => profile.id !== id) }));
    void removeDeletedProfileKey(db, id).catch(() => {});
  }

  async function rename(displayName: string) {
    await renameProfile(db, activeId(), displayName);
    await refresh();
  }

  return <Context.Provider value={{ settings, profiles, loading, loadError, reload, save, signUp, signIn, signOut, deleteActiveProfile, rename }}>{children}</Context.Provider>;
}

export function useActiveProfileId() {
  const { settings } = useUserSettings();
  if (!settings) throw new Error('No active profile');
  return settings.id;
}

export function useUserSettings() {
  const context = useContext(Context);
  if (!context) throw new Error('UserSettingsProvider is missing');
  return context;
}
