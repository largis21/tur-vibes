import { Directory, File, Paths } from "expo-file-system";
import type { Region } from "react-native-maps";

const STATE_DIR = new Directory(Paths.document, "app-state");
const REGION_FILE = new File(STATE_DIR, "last-region.json");

export function loadLastRegion(): Region | null {
  try {
    if (!REGION_FILE.exists) return null;
    const raw = REGION_FILE.text();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.latitude === "number" &&
      typeof parsed?.longitude === "number" &&
      typeof parsed?.latitudeDelta === "number" &&
      typeof parsed?.longitudeDelta === "number"
    ) {
      return parsed as Region;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLastRegion(region: Region) {
  try {
    STATE_DIR.create({ idempotent: true, intermediates: true });
    REGION_FILE.write(JSON.stringify(region));
  } catch {
    // ignore
  }
}
