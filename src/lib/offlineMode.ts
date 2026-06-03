import {
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
  STORAGE_KEYS,
} from "./storage";

export function loadOfflineMode(): boolean {
  return safeGetItem(STORAGE_KEYS.offlineMode) === "1";
}

export function saveOfflineMode(enabled: boolean) {
  if (enabled) {
    safeSetItem(STORAGE_KEYS.offlineMode, "1");
  } else {
    safeRemoveItem(STORAGE_KEYS.offlineMode);
  }
}
