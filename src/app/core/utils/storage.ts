/*
 * Browser storage is a per-device convenience (favourites, last place, theme).
 * It can be unavailable — private mode, blocked site data — so every access is
 * guarded and the app always works without it.
 */

const PREFIX = 'lm.';
/** The app was called "¿Qué tal hoy?" first: its keys move to the new prefix when first read. */
const LEGACY_PREFIX = 'qth.';

export function readStored<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const storage = globalThis.localStorage;
    let raw = storage?.getItem(PREFIX + key);
    if (raw == null) {
      raw = storage?.getItem(LEGACY_PREFIX + key);
      if (raw == null) return null;
      storage?.setItem(PREFIX + key, raw);
      storage?.removeItem(LEGACY_PREFIX + key);
    }
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the in-memory state still holds.
  }
}

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
