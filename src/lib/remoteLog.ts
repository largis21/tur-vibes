// Remote console forwarding for mobile debugging.
//
// In dev, every call to console.{log,info,warn,error,debug} is mirrored to
// `POST /__log` so it shows up in the Vite dev server terminal. See the
// remoteLogPlugin in vite.config.ts for the server side.
//
// Disabled in production builds.

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

const LEVELS: LogLevel[] = ["log", "info", "warn", "error", "debug"];

function safeStringify(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}\n${value.stack ?? ""}`;
  }
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, (_k, v) => {
      if (v instanceof Error) {
        return { name: v.name, message: v.message, stack: v.stack };
      }
      return v;
    });
  } catch {
    return String(value);
  }
}

export function setupRemoteLogging() {
  if (!import.meta.env.DEV) return;
  if (typeof window === "undefined") return;

  const sessionId =
    Math.random().toString(36).slice(2, 8) +
    "-" +
    (navigator.userAgent.match(/iPhone|iPad|Android|Mobile/i)?.[0] ??
      "browser");

  const queue: { level: LogLevel; parts: string[]; t: number }[] = [];
  let flushScheduled = false;

  function flush() {
    flushScheduled = false;
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    // Use sendBeacon on unload, fetch otherwise.
    try {
      void fetch("/__log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, entries: batch }),
        keepalive: true,
      });
    } catch {
      // Ignore — we don't want logging itself to throw.
    }
  }

  function schedule() {
    if (flushScheduled) return;
    flushScheduled = true;
    // Coalesce bursts within an animation frame.
    setTimeout(flush, 50);
  }

  for (const level of LEVELS) {
    const original = (
      (console as unknown as Record<string, unknown>)[level] as (
        ...args: unknown[]
      ) => void
    ).bind(console);
    (console as unknown as Record<string, unknown>)[level] = (
      ...args: unknown[]
    ) => {
      (original as (...args: unknown[]) => void)(...args);
      try {
        queue.push({
          level,
          parts: args.map(safeStringify),
          t: Date.now(),
        });
        schedule();
      } catch {
        // Ignore.
      }
    };
  }

  window.addEventListener("error", (event) => {
    console.error("[window.error]", event.message, event.error ?? "");
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[unhandledrejection]", event.reason);
  });
}
