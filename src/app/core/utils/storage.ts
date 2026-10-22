/*
 * Browser storage is a per-device convenience (favourites, last place, theme).
 * It can be unavailable — private mode, blocked site data — so every access is
 * guarded and the app always works without it.
 */

const PREFIX = 'qth.';

export function readStored<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    if (raw == null) return null;
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
