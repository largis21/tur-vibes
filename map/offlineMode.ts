import { Directory, File, Paths } from "expo-file-system";

const STATE_DIR = new Directory(Paths.document, "app-state");
const OFFLINE_MODE_FILE = new File(STATE_DIR, "offline-mode.json");

export function loadOfflineMode(): boolean {
  try {
    if (!OFFLINE_MODE_FILE.exists) return false;
    const raw = OFFLINE_MODE_FILE.text();
    return JSON.parse(raw)?.enabled === true;
  } catch {
    return false;
  }
}

export function saveOfflineMode(enabled: boolean) {
  try {
    STATE_DIR.create({ idempotent: true, intermediates: true });
    OFFLINE_MODE_FILE.write(JSON.stringify({ enabled }));
  } catch {
    // ignore
  }
}
