/**
 * Centralized localStorage keys and safe accessors.
 *
 * All persisted state in this app lives under a `tur-vibes:` prefix so it
 * doesn't collide with anything else hosted on the same origin.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export const STORAGE_KEYS = {
  offlineMode: "tur-vibes:offline-mode",
  lastRegion: "tur-vibes:last-region",
  savedRegions: "tur-vibes:saved-regions",
  steepnessOpacity: "tur-vibes:steepness-opacity",
  permissions: "tur-vibes:permissions",
  navigationBearings: "tur-vibes:navigation:bearings",
  bearings: "tur-vibes:bearings",
  onboardingCompleted: "tur-vibes:onboarding-completed",
  customPois: "tur-vibes:custom-pois",
  lists: "tur-vibes:lists",
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

type PersistedStateOptions<T> = {
  /** Validate a parsed value. If it returns false the fallback is used. */
  validate?: (value: unknown) => value is T;
  /**
   * How to (de)serialize the value. Defaults to JSON.
   * Provide a custom codec when storing strings/numbers without JSON quoting,
   * or when you need a tagged on-disk representation.
   */
  codec?: {
    parse: (raw: string) => T;
    stringify: (value: T) => string;
  };
};

const JSON_CODEC = {
  parse: <T>(raw: string) => JSON.parse(raw) as T,
  stringify: <T>(value: T) => JSON.stringify(value),
};

/**
 * useState that mirrors itself to localStorage.
 *
 * - Reads the initial value lazily from storage on first render.
 * - Writes on every change (silently no-ops on quota/access errors).
 * - Subscribes to the cross-tab `storage` event so multiple tabs stay in sync.
 *
 * Pass `validate` to defend against shape-shifted on-disk values; if validation
 * fails the `defaultValue` is used instead.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: PersistedStateOptions<T> = {},
): [T, (value: T | ((prev: T) => T)) => void] {
  const { validate, codec = JSON_CODEC } = options;

  // Keep refs in step so the cross-tab listener never closes over a stale
  // value or codec/validator.
  const codecRef = useRef(codec);
  codecRef.current = codec;
  const validateRef = useRef(validate);
  validateRef.current = validate;

  const [value, setValue] = useState<T>(() => {
    const raw = safeGetItem(key);
    if (raw == null) return defaultValue;
    try {
      const parsed = codec.parse(raw);
      if (validate && !validate(parsed)) return defaultValue;
      return parsed;
    } catch {
      return defaultValue;
    }
  });

  // Track latest value so updater functions in setValue see fresh state when
  // the storage event fires.
  const valueRef = useRef(value);
  valueRef.current = value;

  const setPersisted = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        try {
          safeSetItem(key, codecRef.current.stringify(resolved));
        } catch {
          // ignore
        }
        return resolved;
      });
    },
    [key],
  );

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== key) return;
      if (e.newValue == null) {
        setValue(defaultValue);
        return;
      }
      try {
        const parsed = codecRef.current.parse(e.newValue);
        if (validateRef.current && !validateRef.current(parsed)) return;
        setValue(parsed);
      } catch {
        // ignore — keep current value
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // defaultValue intentionally not in deps — treated as initial-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setPersisted];
}

/** String codec for `usePersistedState` — stores the raw string. */
export const STRING_CODEC = {
  parse: (raw: string) => raw,
  stringify: (value: string) => value,
};

/** Number codec — stores `Number.toString()`. */
export const NUMBER_CODEC = {
  parse: (raw: string) => Number(raw),
  stringify: (value: number) => String(value),
};
