import { useSyncExternalStore, useEffect, useRef, useState } from "react";
import { PiWarning, PiWarningCircle } from "react-icons/pi";
import { logger, type LogEntry } from "../lib/logger";

const MAX_VISIBLE_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

export function ToastHost(): JSX.Element {
  // Subscribe to logger reactively
  const logEntries = useSyncExternalStore(logger.subscribe, logger.getSnapshot);

  // Track which entry IDs we've already shown (to avoid replaying history)
  const shownIdsRef = useRef<Set<string>>(new Set());

  // Local state for visible toasts
  const [visibleToasts, setVisibleToasts] = useState<LogEntry[]>([]);

  // Timers for auto-dismiss
  const timersRef = useRef<Map<string, number>>(new Map());

  // On first mount, seed the shown set with all current IDs to skip historical logs
  useEffect(() => {
    const initialIds = logEntries.map((entry) => entry.id);
    shownIdsRef.current = new Set(initialIds);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect new warn/error entries and add them as toasts
  useEffect(() => {
    const newToasts: LogEntry[] = [];

    for (const entry of logEntries) {
      // Only show warn and error entries
      if (entry.level !== "warn" && entry.level !== "error") continue;

      // Skip if already shown
      if (shownIdsRef.current.has(entry.id)) continue;

      // Skip if already visible
      if (visibleToasts.some((t) => t.id === entry.id)) continue;

      newToasts.push(entry);
      shownIdsRef.current.add(entry.id);
    }

    if (newToasts.length > 0) {
      setVisibleToasts((prev) => {
        // Add new toasts to the front (newest on top)
        const updated = [...newToasts, ...prev];
        // Cap to max visible
        return updated.slice(0, MAX_VISIBLE_TOASTS);
      });

      // Set auto-dismiss timers for new toasts
      newToasts.forEach((toast) => {
        const timer = setTimeout(() => {
          dismissToast(toast.id);
        }, AUTO_DISMISS_MS);
        timersRef.current.set(toast.id, timer);
      });
    }
  }, [logEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const dismissToast = (id: string) => {
    setVisibleToasts((prev) => prev.filter((t) => t.id !== id));

    // Clear the timer for this toast
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  };

  if (visibleToasts.length === 0) {
    return <></>;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 flex flex-col items-center gap-2 pt-4 px-4 z-[100] pointer-events-none"
    >
      {visibleToasts.map((toast) => {
        const isError = toast.level === "error";
        const Icon = isError ? PiWarningCircle : PiWarning;
        const accentColor = isError ? "border-red-400" : "border-amber-400";
        const iconColor = isError ? "text-red-400" : "text-amber-400";
        const bgTint = isError
          ? "bg-[rgba(17,24,39,0.96)] border-l-4"
          : "bg-[rgba(17,24,39,0.96)] border-l-4";

        return (
          <button
            key={toast.id}
            role="alert"
            aria-label={`${toast.level}: ${toast.message}`}
            onClick={() => dismissToast(toast.id)}
            className={`
              ${bgTint} ${accentColor}
              pointer-events-auto
              max-w-[420px] w-full
              rounded-lg
              px-4 py-3
              flex items-start gap-3
              text-white
              shadow-lg
              cursor-pointer
              hover:opacity-90
              transition-opacity
            `}
          >
            <Icon className={`${iconColor} text-xl flex-shrink-0 mt-0.5`} />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium line-clamp-2">
                {toast.message}
              </p>
              {toast.source && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {toast.source}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
