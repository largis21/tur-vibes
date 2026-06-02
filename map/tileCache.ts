import { Directory, File, Paths } from "expo-file-system";
import { useEffect } from "react";

export const KARTVERKET_TOPO_TILES =
  "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png";

export const STEEPNESS_RUNOUT_TILES =
  "https://gis3.nve.no/arcgis/rest/services/wmts/Bratthet_med_utlop_2024/MapServer/tile/{z}/{y}/{x}";

export const KARTVERKET_TILE_CACHE = new Directory(
  Paths.cache,
  "kartverket-tiles",
);

export const STEEPNESS_TILE_CACHE = new Directory(
  Paths.cache,
  "steepness-tiles",
);

const KARTVERKET_TILE_CACHE_RETENTION_SECONDS = 60 * 60 * 24 * 7;
const KARTVERKET_TILE_CACHE_RETENTION_MS =
  KARTVERKET_TILE_CACHE_RETENTION_SECONDS * 1000;

function pruneExpiredTileFiles(directory: Directory, cutoffTime: number) {
  for (const entry of directory.list()) {
    if (entry instanceof Directory) {
      pruneExpiredTileFiles(entry, cutoffTime);
      continue;
    }

    if (entry instanceof File && entry.modificationTime !== null) {
      if (entry.modificationTime < cutoffTime) {
        entry.delete();
      }
    }
  }
}

export function useKartverketTileCache() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      const cutoff = Date.now() - KARTVERKET_TILE_CACHE_RETENTION_MS;
      for (const dir of [KARTVERKET_TILE_CACHE, STEEPNESS_TILE_CACHE]) {
        dir.create({ idempotent: true, intermediates: true });
        pruneExpiredTileFiles(dir, cutoff);
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, []);
}
