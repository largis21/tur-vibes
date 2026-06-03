import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from "./storage";
import type { Region } from "./types";

function isRegion(value: unknown): value is Region {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.latitude === "number" &&
    typeof v.longitude === "number" &&
    typeof v.latitudeDelta === "number" &&
    typeof v.longitudeDelta === "number"
  );
}

export function loadLastRegion(): Region | null {
  return safeGetJSON<Region | null>(STORAGE_KEYS.lastRegion, null, (v): v is Region | null =>
    v === null || isRegion(v),
  );
}

export function saveLastRegion(region: Region) {
  safeSetJSON(STORAGE_KEYS.lastRegion, region);
}
