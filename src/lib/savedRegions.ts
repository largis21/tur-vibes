import type { OfflineRegionBounds } from "./offlineTiles";

const KEY = "tur-vibes:saved-regions";

export type SavedOfflineRegion = {
  id: string;
  bounds: OfflineRegionBounds;
  createdAt: number;
};

export function loadSavedRegions(): SavedOfflineRegion[] {
  try {
    const raw = localStorage.getItem(KEY);
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
    localStorage.setItem(KEY, JSON.stringify(regions));
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
