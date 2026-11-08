import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'jc.gemini.personalKey';
// Web previews keep the key only in memory; never persist it in browser storage.
const previewKeys = new Map<number, string>();
const keyWrites = new Map<number, Promise<void>>();

const storageKey = (profileId: number) => profileId === 1 ? STORAGE_KEY : `${STORAGE_KEY}.${profileId}`;

async function writeKey(profileId: number, write: () => Promise<void>) {
  const pending = (keyWrites.get(profileId) ?? Promise.resolve()).catch(() => {}).then(write);
  keyWrites.set(profileId, pending);
  try {
    await pending;
  } finally {
    if (keyWrites.get(profileId) === pending) keyWrites.delete(profileId);
  }
}

export async function getPersonalApiKey(profileId = 1): Promise<string | null> {
  return Platform.OS === 'web' ? previewKeys.get(profileId) ?? null : SecureStore.getItemAsync(storageKey(profileId));
}

export async function savePersonalApiKey(value: string, profileId = 1): Promise<void> {
  const key = value.trim();
  if (!key || /\s|,/.test(key) || key.length > 512) throw new Error('Paste one API key without spaces or commas.');
  if (Platform.OS === 'web') previewKeys.set(profileId, key);
  else await writeKey(profileId, () => SecureStore.setItemAsync(storageKey(profileId), key));
}

export async function removePersonalApiKey(profileId = 1): Promise<void> {
  if (Platform.OS === 'web') previewKeys.delete(profileId);
  else await writeKey(profileId, () => SecureStore.deleteItemAsync(storageKey(profileId)));
}
