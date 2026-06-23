import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from "./storage";
import type { LatLng } from "./types";

export type SavedOfflineRegion = {
  id: string;
  polygon: LatLng[];
  createdAt: number;
  /** Which source IDs (e.g. "topo", "steepness", "npolars-svalbard") have cached tiles for this region.
   *  Defaults to ["topo", "steepness"] for backwards compatibility with legacy saved regions. */
  sourceIds: string[];
  /** Exact tile keys ("sourceId/z/x/y") downloaded for this region.
   *  Empty for legacy regions — fall back to geometry-based deletion in that case. */
  tileKeys: string[];
  /** Min zoom used when downloading tiles. */
  minZoom: number;
  /** Max zoom per source used when downloading tiles. */
  maxZoomBySource: Record<string, number>;
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
  const createdAt = typeof r.createdAt === "number" ? r.createdAt : Date.now();

  let polygon: LatLng[] | null = null;
  if (isPolygon(r.polygon)) {
    polygon = r.polygon;
  } else if (isLegacyBounds(r.bounds)) {
    polygon = boundsToPolygon(r.bounds);
  }

  if (!polygon) return null;

  // Backwards compatibility: if sourceIds is missing, default to ["topo", "steepness"]
  const sourceIds = Array.isArray(r.sourceIds)
    ? (r.sourceIds as unknown[]).every((id) => typeof id === "string")
      ? (r.sourceIds as string[])
      : ["topo", "steepness"]
    : ["topo", "steepness"];

  // Backwards compatibility: tileKeys, minZoom, maxZoomBySource are optional
  const tileKeys =
    Array.isArray(r.tileKeys) &&
    (r.tileKeys as unknown[]).every((k) => typeof k === "string")
      ? (r.tileKeys as string[])
      : [];

  const minZoom = typeof r.minZoom === "number" ? r.minZoom : 11;

  const maxZoomBySource: Record<string, number> =
    r.maxZoomBySource &&
    typeof r.maxZoomBySource === "object" &&
    !Array.isArray(r.maxZoomBySource)
      ? (r.maxZoomBySource as Record<string, number>)
      : {};

  return { id: r.id, polygon, createdAt, sourceIds, tileKeys, minZoom, maxZoomBySource };
}

export function loadSavedRegions(): SavedOfflineRegion[] {
  const raw = safeGetJSON<unknown>(STORAGE_KEYS.savedRegions, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(normalize).filter((r): r is SavedOfflineRegion => r !== null);
}

function writeRegions(regions: SavedOfflineRegion[]) {
  safeSetJSON(STORAGE_KEYS.savedRegions, regions);
}

export function addSavedRegion(
  polygon: LatLng[],
  sourceIds: string[] = ["topo", "steepness"],
  tileKeys: string[] = [],
  minZoom: number = 11,
  maxZoomBySource: Record<string, number> = {},
): SavedOfflineRegion {
  const region: SavedOfflineRegion = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    polygon,
    createdAt: Date.now(),
    sourceIds,
    tileKeys,
    minZoom,
    maxZoomBySource,
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
