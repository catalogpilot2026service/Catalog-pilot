// src/lib/storage.ts
// Chrome storage helpers — Promise-based wrappers around chrome.storage.local.

import {
  DEFAULT_SETTINGS,
  type ExtensionSettings,
  type SessionState,
  type ListingProfile,
} from './types';

const KEYS = {
  SETTINGS: 'cp_settings',
  SESSION: 'cp_session',
  CACHED_PROFILES: 'cp_cached_profiles',
  DEVICE_ID: 'cp_device_id',
  INSTALLED_AT: 'cp_installed_at',
} as const;

// ----- Settings -----

export async function getSettings(): Promise<ExtensionSettings> {
  try {
    const result = await chrome.storage.local.get(KEYS.SETTINGS);
    const stored = result[KEYS.SETTINGS] as Partial<ExtensionSettings> | undefined;
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [KEYS.SETTINGS]: settings });
}

// ----- Session -----

export async function getSession(): Promise<SessionState | null> {
  try {
    const result = await chrome.storage.local.get(KEYS.SESSION);
    const session = result[KEYS.SESSION] as SessionState | undefined;
    return session ?? null;
  } catch {
    return null;
  }
}

export async function saveSession(session: SessionState): Promise<void> {
  await chrome.storage.local.set({ [KEYS.SESSION]: session });
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(KEYS.SESSION);
}

export function isSessionValid(session: SessionState | null): boolean {
  if (!session) return false;
  const now = Math.floor(Date.now() / 1000);
  return session.expiresAt > now + 60; // 60s buffer
}

// ----- Profile cache -----

export async function cacheProfiles(profiles: ListingProfile[]): Promise<void> {
  await chrome.storage.local.set({
    [KEYS.CACHED_PROFILES]: profiles,
    cp_cached_at: Date.now(),
  });
}

export async function getCachedProfiles(): Promise<ListingProfile[]> {
  try {
    const result = await chrome.storage.local.get(KEYS.CACHED_PROFILES);
    return (result[KEYS.CACHED_PROFILES] as ListingProfile[] | undefined) ?? [];
  } catch {
    return [];
  }
}

// ----- Device ID (stable per-install identifier for activity logging) -----

export async function getDeviceId(): Promise<string> {
  const result = await chrome.storage.local.get(KEYS.DEVICE_ID);
  let id = result[KEYS.DEVICE_ID] as string | undefined;
  if (!id) {
    id = `ext_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await chrome.storage.local.set({ [KEYS.DEVICE_ID]: id });
  }
  return id;
}
