import { Directory, File, Paths } from "expo-file-system";
import type { Region } from "react-native-maps";
import { KARTVERKET_TOPO_TILES, STEEPNESS_RUNOUT_TILES } from "./tileCache";

const OFFLINE_ROOT = new Directory(Paths.document, "offline-tiles");

export type OfflineLayerId = "topo" | "steepness";

type LayerConfig = {
  id: OfflineLayerId;
  url: string;
  extension: string;
  maxZoom: number;
  directory: Directory;
};

export const OFFLINE_LAYERS: Record<OfflineLayerId, LayerConfig> = {
  topo: {
    id: "topo",
    url: KARTVERKET_TOPO_TILES,
    extension: "png",
    maxZoom: 18,
    directory: new Directory(OFFLINE_ROOT, "topo"),
  },
  steepness: {
    id: "steepness",
    url: STEEPNESS_RUNOUT_TILES,
    extension: "png",
    maxZoom: 16,
    directory: new Directory(OFFLINE_ROOT, "steepness"),
  },
};

export function getOfflinePathTemplate(layer: OfflineLayerId) {
  const cfg = OFFLINE_LAYERS[layer];
  const path = cfg.directory.uri.replace(/^file:\/\//, "").replace(/\/$/, "");
  return `${path}/{z}/{x}/{y}.${cfg.extension}`;
}

function lonToTileXFloat(lon: number, z: number) {
  return ((lon + 180) / 360) * Math.pow(2, z);
}

function latToTileYFloat(lat: number, z: number) {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, z)
  );
}

export type TileCoord = {
  layer: OfflineLayerId;
  z: number;
  x: number;
  y: number;
};

export type OfflineRegionBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export function regionToBounds(region: Region): OfflineRegionBounds {
  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    minLon: region.longitude - region.longitudeDelta / 2,
    maxLon: region.longitude + region.longitudeDelta / 2,
  };
}

export function listTilesForBounds(
  bounds: OfflineRegionBounds,
  minZoom: number,
  maxZoom: number,
  layers: OfflineLayerId[],
): TileCoord[] {
  const tiles: TileCoord[] = [];
  // Tiny epsilon shrinks bounds so a coord lying exactly on a tile boundary
  // doesn't pull in a neighbouring tile that isn't actually inside the box.
  const epsilon = 1e-9;
  for (const layer of layers) {
    const cfg = OFFLINE_LAYERS[layer];
    const layerMaxZoom = Math.min(maxZoom, cfg.maxZoom);
    for (let z = minZoom; z <= layerMaxZoom; z += 1) {
      const max = Math.pow(2, z) - 1;
      const xMinF = lonToTileXFloat(bounds.minLon + epsilon, z);
      const xMaxF = lonToTileXFloat(bounds.maxLon - epsilon, z);
      const yMinF = latToTileYFloat(bounds.maxLat - epsilon, z);
      const yMaxF = latToTileYFloat(bounds.minLat + epsilon, z);
      const xMin = Math.max(0, Math.floor(Math.min(xMinF, xMaxF)));
      const xMax = Math.min(max, Math.floor(Math.max(xMinF, xMaxF)));
      const yMin = Math.max(0, Math.floor(Math.min(yMinF, yMaxF)));
      const yMax = Math.min(max, Math.floor(Math.max(yMinF, yMaxF)));
      for (let x = xMin; x <= xMax; x += 1) {
        for (let y = yMin; y <= yMax; y += 1) {
          tiles.push({ layer, z, x, y });
        }
      }
    }
  }
  return tiles;
}

function tileUrl(coord: TileCoord) {
  return OFFLINE_LAYERS[coord.layer].url
    .replace("{z}", String(coord.z))
    .replace("{x}", String(coord.x))
    .replace("{y}", String(coord.y));
}

function tileFile(coord: TileCoord) {
  const cfg = OFFLINE_LAYERS[coord.layer];
  return new File(
    cfg.directory,
    String(coord.z),
    String(coord.x),
    `${coord.y}.${cfg.extension}`,
  );
}

export type DownloadProgress = {
  total: number;
  completed: number;
  failed: number;
};

export type DownloadHandle = {
  promise: Promise<DownloadProgress>;
  cancel: () => void;
};

const CONCURRENCY = 6;

export function downloadOfflineTiles(
  tiles: TileCoord[],
  onProgress: (progress: DownloadProgress) => void,
): DownloadHandle {
  let cancelled = false;
  let completed = 0;
  let failed = 0;
  let index = 0;

  for (const cfg of Object.values(OFFLINE_LAYERS)) {
    cfg.directory.create({ idempotent: true, intermediates: true });
  }

  async function worker() {
    while (!cancelled) {
      const i = index;
      index += 1;
      if (i >= tiles.length) return;
      const coord = tiles[i];
      const file = tileFile(coord);
      try {
        if (file.exists) {
          completed += 1;
        } else {
          file.parentDirectory.create({
            idempotent: true,
            intermediates: true,
          });
          await File.downloadFileAsync(tileUrl(coord), file, {
            idempotent: true,
          });
          completed += 1;
        }
      } catch {
        failed += 1;
      }
      if (!cancelled) {
        onProgress({ total: tiles.length, completed, failed });
      }
    }
  }

  const promise = (async () => {
    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);
    return { total: tiles.length, completed, failed };
  })();

  return {
    promise,
    cancel: () => {
      cancelled = true;
    },
  };
}

export function getOfflineTilesSize(): number {
  if (!OFFLINE_ROOT.exists) return 0;
  return OFFLINE_ROOT.size ?? 0;
}

export function clearOfflineTiles() {
  if (OFFLINE_ROOT.exists) {
    OFFLINE_ROOT.delete();
  }
}

export function boundsIntersect(
  a: OfflineRegionBounds,
  b: OfflineRegionBounds,
): boolean {
  return (
    a.minLon < b.maxLon &&
    a.maxLon > b.minLon &&
    a.minLat < b.maxLat &&
    a.maxLat > b.minLat
  );
}

export function clearTilesInBounds(
  bounds: OfflineRegionBounds,
  minZoom: number,
  maxZoom: number,
): number {
  const tiles = listTilesForBounds(bounds, minZoom, maxZoom, [
    "topo",
    "steepness",
  ]);
  let deleted = 0;
  for (const coord of tiles) {
    const file = tileFile(coord);
    if (file.exists) {
      try {
        file.delete();
        deleted += 1;
      } catch {
        // ignore
      }
    }
  }
  return deleted;
}
