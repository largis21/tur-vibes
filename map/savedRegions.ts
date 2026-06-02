import { Directory, File, Paths } from "expo-file-system";
import type { OfflineRegionBounds } from "./offlineTiles";

const STATE_DIR = new Directory(Paths.document, "app-state");
const REGIONS_FILE = new File(STATE_DIR, "offline-regions.json");

export type SavedOfflineRegion = {
  id: string;
  bounds: OfflineRegionBounds;
  createdAt: number;
};

export function loadSavedRegions(): SavedOfflineRegion[] {
  try {
    if (!REGIONS_FILE.exists) return [];
    const raw = REGIONS_FILE.text();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        r.bounds &&
        typeof r.bounds.minLat === "number" &&
        typeof r.bounds.maxLat === "number" &&
        typeof r.bounds.minLon === "number" &&
        typeof r.bounds.maxLon === "number",
    );
  } catch {
    return [];
  }
}

function writeRegions(regions: SavedOfflineRegion[]) {
  try {
    STATE_DIR.create({ idempotent: true, intermediates: true });
    REGIONS_FILE.write(JSON.stringify(regions));
  } catch {
    // ignore
  }
}

export function addSavedRegion(
  bounds: OfflineRegionBounds,
): SavedOfflineRegion {
  const region: SavedOfflineRegion = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bounds,
    createdAt: Date.now(),
  };
  const regions = [...loadSavedRegions(), region];
  writeRegions(regions);
  return region;
}

export function clearSavedRegions() {
  writeRegions([]);
}

export function removeSavedRegions(ids: Set<string>): SavedOfflineRegion[] {
  const remaining = loadSavedRegions().filter((r) => !ids.has(r.id));
  writeRegions(remaining);
  return remaining;
}
