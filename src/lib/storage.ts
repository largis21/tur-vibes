/**
 * Centralized localStorage keys and safe accessors.
 *
 * All persisted state in this app lives under a `tur-vibes:` prefix so it
 * doesn't collide with anything else hosted on the same origin.
 */

export const STORAGE_KEYS = {
  offlineMode: "tur-vibes:offline-mode",
  lastRegion: "tur-vibes:last-region",
  savedRegions: "tur-vibes:saved-regions",
  steepnessOpacity: "tur-vibes:steepness-opacity",
  permissions: "tur-vibes:permissions",
  navigationBearings: "tur-vibes:navigation:bearings",
  onboardingCompleted: "tur-vibes:onboarding-completed",
} as const;

/** Read a raw string. Returns null on any failure (private mode, missing). */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Write a raw string. Silently swallows quota / access errors. */
export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/** Remove a key. Silently swallows access errors. */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Read and JSON-parse a value. Returns `fallback` if the key is missing or
 * the parsed value fails the optional `validate` predicate.
 */
export function safeGetJSON<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T {
  const raw = safeGetItem(key);
  if (raw == null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** JSON-stringify and store. */
export function safeSetJSON(key: string, value: unknown): void {
  try {
    safeSetItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
