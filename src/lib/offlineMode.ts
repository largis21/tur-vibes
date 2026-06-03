const KEY = "tur-vibes:offline-mode";

export function loadOfflineMode(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function saveOfflineMode(enabled: boolean) {
  try {
    if (enabled) {
      localStorage.setItem(KEY, "1");
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // ignore
  }
}
