import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

/**
 * Hook that tracks the browser's network connection status.
 * Returns `true` if online, `false` if offline.
 * Uses `useSyncExternalStore` to subscribe to online/offline events.
 */
export function useNetworkConnection() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
