/**
 * Centralized logging core.
 *
 * A module-level singleton logger usable from both React and plain lib code.
 * Stores logs in memory (newest-first) and persists to localStorage with
 * debounced writes. Retention: all error entries < 7 days + newest 500
 * non-protected entries.
 */

import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from "./storage";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogData {
  source?: string;
  /** The ONLY canonical key for exceptions. Anything thrown goes here. */
  error?: unknown;
  op?: string;
  id?: string | number;
  count?: number;
  durationMs?: number;
  coords?: { latitude: number; longitude: number };
  url?: string;
  status?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  id: string;
  ts: number; // epoch ms
  level: LogLevel;
  message: string;
  source?: string;
  data?: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// Module state
// ----------------------------------------------------------------------------

/** In-memory entries, newest-first (index 0 = most recent). */
let entries: LogEntry[] = [];

/** Cached snapshot reference. Only replaced when entries change. */
let snapshot: LogEntry[] = [];

/** Subscription listeners. */
const listeners = new Set<() => void>();

/** Debounced flush guard. */
let flushScheduled = false;

// ----------------------------------------------------------------------------
// Persistence & retention
// ----------------------------------------------------------------------------

/**
 * Load persisted entries from localStorage on module init. Defensive parsing:
 * if shape is invalid, start with empty.
 */
function loadEntries(): void {
  try {
    const persisted = safeGetJSON<unknown>(STORAGE_KEYS.logs, []);
    if (!Array.isArray(persisted)) {
      entries = [];
      return;
    }
    // Validate shape
    const validated: LogEntry[] = [];
    for (const item of persisted) {
      if (
        item != null &&
        typeof item === "object" &&
        "id" in item &&
        "ts" in item &&
        "level" in item &&
        "message" in item &&
        typeof item.id === "string" &&
        typeof item.ts === "number" &&
        typeof item.message === "string" &&
        (item.level === "debug" ||
          item.level === "info" ||
          item.level === "warn" ||
          item.level === "error")
      ) {
        validated.push(item as LogEntry);
      }
    }
    entries = validated;
    snapshot = entries.slice();
  } catch {
    entries = [];
    snapshot = [];
  }
}

/**
 * Apply retention policy and persist to localStorage.
 *
 * Retention rule:
 * - Protected = entries where level === "error" AND age < 7 days (604800000 ms).
 * - Keep ALL protected error entries.
 * - From remaining (non-protected) entries, keep newest 500.
 * - Final retained = protected ∪ keptNonProtected, re-sorted newest-first.
 */
function flush(): void {
  flushScheduled = false;
  try {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const protected_: LogEntry[] = [];
    const nonProtected: LogEntry[] = [];

    for (const entry of entries) {
      const age = now - entry.ts;
      if (entry.level === "error" && age < sevenDaysMs) {
        protected_.push(entry);
      } else {
        nonProtected.push(entry);
      }
    }

    // Keep newest 500 from non-protected
    const keptNonProtected = nonProtected.slice(0, 500);

    // Combine and sort newest-first
    const retained = [...protected_, ...keptNonProtected].sort(
      (a, b) => b.ts - a.ts,
    );

    // Trim in-memory array to match retained
    entries = retained;
    snapshot = entries.slice();

    // Persist
    safeSetJSON(STORAGE_KEYS.logs, retained);
  } catch {
    // Never let logging throw
  }
}

/**
 * Schedule a debounced flush (coalesce bursts within 50ms).
 */
function schedule(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  setTimeout(flush, 50);
}

// ----------------------------------------------------------------------------
// Data sanitization
// ----------------------------------------------------------------------------

/**
 * Convert Error instances to { name, message, stack }.
 * Handle circular refs / non-serializable values with JSON round-trip.
 * Returns { source?, data? } to be merged into LogEntry.
 */
function serializeData(data?: LogData): {
  source?: string;
  data?: Record<string, unknown>;
} {
  if (data == null) return {};

  try {
    const { source, ...rest } = data;

    // Convert any Error values to plain objects
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      } else {
        sanitized[key] = value;
      }
    }

    // JSON round-trip to catch circular refs / non-serializable values
    try {
      const json = JSON.stringify(sanitized, (_k, v) => {
        if (v instanceof Error) {
          return { name: v.name, message: v.message, stack: v.stack };
        }
        return v;
      });
      const parsed = JSON.parse(json) as Record<string, unknown>;
      return {
        source,
        data: Object.keys(parsed).length > 0 ? parsed : undefined,
      };
    } catch {
      // Fallback on serialization failure
      return {
        source,
        data: { note: "unserializable" },
      };
    }
  } catch {
    return {};
  }
}

// ----------------------------------------------------------------------------
// Subscription & snapshot
// ----------------------------------------------------------------------------

/**
 * Notify all listeners (called after any mutation: log/clear/load).
 */
function notify(): void {
  try {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Ignore listener errors
      }
    });
  } catch {
    // Never let logging throw
  }
}

/**
 * Subscribe to changes. Returns an unsubscribe function.
 */
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get a STABLE snapshot of entries. Returns the same array reference
 * between mutations (required for React useSyncExternalStore).
 */
function getSnapshot(): LogEntry[] {
  return snapshot;
}

// ----------------------------------------------------------------------------
// Logging methods
// ----------------------------------------------------------------------------

/**
 * Generate a unique ID for a log entry.
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Append a log entry (newest-first: unshift to front).
 */
function appendEntry(level: LogLevel, message: string, data?: LogData): void {
  try {
    const { source, data: sanitizedData } = serializeData(data);
    const entry: LogEntry = {
      id: generateId(),
      ts: Date.now(),
      level,
      message,
      source,
      data: sanitizedData,
    };

    // Prepend to front (newest-first)
    entries.unshift(entry);

    // Update snapshot (new reference)
    snapshot = entries.slice();

    // Notify listeners
    notify();

    // Schedule persistence
    schedule();
  } catch {
    // Never let logging throw
  }
}

function debug(message: string, data?: LogData): void {
  appendEntry("debug", message, data);
}

function info(message: string, data?: LogData): void {
  appendEntry("info", message, data);
}

function warn(message: string, data?: LogData): void {
  appendEntry("warn", message, data);
}

function error(message: string, data?: LogData): void {
  appendEntry("error", message, data);
}

/**
 * Clear all logs.
 */
function clear(): void {
  try {
    entries = [];
    snapshot = [];
    notify();
    schedule(); // Persist empty array
  } catch {
    // Never let logging throw
  }
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

export const logger = {
  debug,
  info,
  warn,
  error,
  subscribe,
  getSnapshot,
  clear,
};

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------

let installed = false;

/**
 * Install global error handlers (idempotent). Call once on app init.
 */
export function setupLogger(): void {
  if (typeof window === "undefined") return;
  if (installed) return;
  installed = true;

  try {
    window.addEventListener("error", (e) => {
      logger.error("Uncaught error", {
        source: "window.error",
        error: e.error ?? e.message,
        url: e.filename,
      });
    });

    window.addEventListener("unhandledrejection", (e) => {
      logger.error("Unhandled promise rejection", {
        source: "window.unhandledrejection",
        error: e.reason,
      });
    });
  } catch {
    // Never let logging throw
  }
}

// ----------------------------------------------------------------------------
// Module initialization
// ----------------------------------------------------------------------------

loadEntries();
