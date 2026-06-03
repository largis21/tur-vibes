import type { Region } from "./types";

const KEY = "tur-vibes:last-region";

export function loadLastRegion(): Region | null {
  try {
    const raw = localStorage.getItem(KEY);
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
    localStorage.setItem(KEY, JSON.stringify(region));
  } catch {
    // ignore quota/access errors
  }
}
