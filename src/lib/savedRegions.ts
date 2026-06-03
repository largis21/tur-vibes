import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from "./storage";
import type { LatLng } from "./types";

export type SavedOfflineRegion = {
  id: string;
  polygon: LatLng[];
  createdAt: number;
};

type LegacyBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

function isPolygon(value: unknown): value is LatLng[] {
  if (!Array.isArray(value) || value.length < 3) return false;
  return value.every(
    (p) =>
      p &&
      typeof p === "object" &&
      typeof (p as LatLng).latitude === "number" &&
      typeof (p as LatLng).longitude === "number",
  );
}

function isLegacyBounds(value: unknown): value is LegacyBounds {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.minLat === "number" &&
    typeof b.maxLat === "number" &&
    typeof b.minLon === "number" &&
    typeof b.maxLon === "number"
  );
}

function boundsToPolygon(b: LegacyBounds): LatLng[] {
  return [
    { latitude: b.minLat, longitude: b.minLon },
    { latitude: b.minLat, longitude: b.maxLon },
    { latitude: b.maxLat, longitude: b.maxLon },
    { latitude: b.maxLat, longitude: b.minLon },
  ];
}

function normalize(value: unknown): SavedOfflineRegion | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  const createdAt =
    typeof r.createdAt === "number" ? r.createdAt : Date.now();
  if (isPolygon(r.polygon)) {
    return { id: r.id, polygon: r.polygon, createdAt };
  }
  if (isLegacyBounds(r.bounds)) {
    return { id: r.id, polygon: boundsToPolygon(r.bounds), createdAt };
  }
  return null;
}

export function loadSavedRegions(): SavedOfflineRegion[] {
  const raw = safeGetJSON<unknown>(STORAGE_KEYS.savedRegions, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalize)
    .filter((r): r is SavedOfflineRegion => r !== null);
}

function writeRegions(regions: SavedOfflineRegion[]) {
  safeSetJSON(STORAGE_KEYS.savedRegions, regions);
}

export function addSavedRegion(polygon: LatLng[]): SavedOfflineRegion {
  const region: SavedOfflineRegion = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    polygon,
    createdAt: Date.now(),
  };
  const regions = [...loadSavedRegions(), region];
  writeRegions(regions);
  return region;
}

export function removeSavedRegions(ids: Set<string>): SavedOfflineRegion[] {
  const remaining = loadSavedRegions().filter((r) => !ids.has(r.id));
  writeRegions(remaining);
  return remaining;
}
