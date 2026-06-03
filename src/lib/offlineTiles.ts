import maplibregl from "maplibre-gl";
import { KARTVERKET_TOPO_TILES, STEEPNESS_RUNOUT_TILES } from "./tileCache";

export type OfflineLayerId = "topo" | "steepness";

type LayerConfig = {
  id: OfflineLayerId;
  url: string;
  protocol: string;
  maxZoom: number;
};

export const OFFLINE_LAYERS: Record<OfflineLayerId, LayerConfig> = {
  topo: {
    id: "topo",
    url: KARTVERKET_TOPO_TILES,
    protocol: "offline-topo",
    maxZoom: 18,
  },
  steepness: {
    id: "steepness",
    url: STEEPNESS_RUNOUT_TILES,
    protocol: "offline-steepness",
    maxZoom: 16,
  },
};

/** Tile URL template MapLibre will request when in offline mode. */
export function getOfflineTileTemplate(layer: OfflineLayerId): string {
  return `${OFFLINE_LAYERS[layer].protocol}://{z}/{x}/{y}`;
}

// ---------------------------------------------------------------------------
// IndexedDB
// ---------------------------------------------------------------------------

const DB_NAME = "tur-vibes-tiles";
const DB_VERSION = 1;
const STORE = "tiles";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  return dbPromise;
}

function tileKey(layer: OfflineLayerId, z: number, x: number, y: number) {
  return `${layer}/${z}/${x}/${y}`;
}

async function putTile(
  layer: OfflineLayerId,
  z: number,
  x: number,
  y: number,
  bytes: ArrayBuffer,
) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(bytes, tileKey(layer, z, x, y));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getTile(
  layer: OfflineLayerId,
  z: number,
  x: number,
  y: number,
): Promise<ArrayBuffer | null> {
  const db = await openDb();
  return new Promise<ArrayBuffer | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(tileKey(layer, z, x, y));
    req.onsuccess = () => resolve((req.result as ArrayBuffer) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export { getTile as getOfflineTile };

async function deleteTile(
  layer: OfflineLayerId,
  z: number,
  x: number,
  y: number,
) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(tileKey(layer, z, x, y));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function listKeysByPrefix(prefix: string): Promise<string[]> {
  const db = await openDb();
  return new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx
      .objectStore(STORE)
      .getAllKeys(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
    req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// MapLibre custom protocol — serves tiles from IndexedDB.
// ---------------------------------------------------------------------------

let protocolsRegistered = false;

export function registerOfflineProtocols() {
  if (protocolsRegistered) return;
  protocolsRegistered = true;
  for (const cfg of Object.values(OFFLINE_LAYERS)) {
    maplibregl.addProtocol(cfg.protocol, async (params) => {
      const m = params.url.match(/^[a-z-]+:\/\/(\d+)\/(\d+)\/(\d+)/);
      if (!m) throw new Error(`bad tile url: ${params.url}`);
      const z = Number(m[1]);
      const x = Number(m[2]);
      const y = Number(m[3]);
      const buf = await getTile(cfg.id, z, x, y);
      if (!buf) {
        // Returning empty triggers a transparent placeholder; MapLibre will
        // overzoom from the closest available zoom level for raster sources.
        return { data: new Uint8Array() };
      }
      return { data: buf };
    });
  }
}

// ---------------------------------------------------------------------------
// Tile math
// ---------------------------------------------------------------------------

export function lonToTileXFloat(lon: number, z: number) {
  return ((lon + 180) / 360) * Math.pow(2, z);
}

export function latToTileYFloat(lat: number, z: number) {
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

export function listTilesForBounds(
  bounds: OfflineRegionBounds,
  minZoom: number,
  maxZoomByLayer: Partial<Record<OfflineLayerId, number>>,
  layers: OfflineLayerId[],
): TileCoord[] {
  const tiles: TileCoord[] = [];
  const epsilon = 1e-9;
  for (const layer of layers) {
    const cfg = OFFLINE_LAYERS[layer];
    const layerMaxZoom = Math.min(
      maxZoomByLayer[layer] ?? cfg.maxZoom,
      cfg.maxZoom,
    );
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

// ---------------------------------------------------------------------------
// Download / clear / size
// ---------------------------------------------------------------------------

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

  const promise = (async () => {
    async function worker() {
      while (!cancelled) {
        const i = index;
        index += 1;
        if (i >= tiles.length) return;
        const coord = tiles[i];
        try {
          const resp = await fetch(tileUrl(coord));
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const buf = await resp.arrayBuffer();
          if (buf.byteLength === 0) throw new Error("empty");
          await putTile(coord.layer, coord.z, coord.x, coord.y, buf);
          completed += 1;
        } catch {
          failed += 1;
        }
        if (!cancelled) {
          onProgress({ total: tiles.length, completed, failed });
        }
      }
    }

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

export async function getOfflineTilesSize(): Promise<number> {
  if (
    typeof navigator !== "undefined" &&
    navigator.storage &&
    typeof navigator.storage.estimate === "function"
  ) {
    try {
      const est = await navigator.storage.estimate();
      return est.usage ?? 0;
    } catch {
      // fall through
    }
  }
  return 0;
}

export async function clearOfflineTiles(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
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

export async function clearTilesInBounds(
  bounds: OfflineRegionBounds,
  minZoom: number,
  maxZoomByLayer: Partial<Record<OfflineLayerId, number>>,
): Promise<number> {
  let deleted = 0;
  const epsilon = 1e-9;
  for (const layer of Object.keys(OFFLINE_LAYERS) as OfflineLayerId[]) {
    const cfg = OFFLINE_LAYERS[layer];
    const layerMaxZoom = Math.min(
      maxZoomByLayer[layer] ?? cfg.maxZoom,
      cfg.maxZoom,
    );
    const allKeys = await listKeysByPrefix(`${layer}/`);
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
      const prefix = `${layer}/${z}/`;
      for (const key of allKeys) {
        if (!key.startsWith(prefix)) continue;
        const parts = key.split("/");
        const x = Number(parts[2]);
        const y = Number(parts[3]);
        if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
          await deleteTile(layer, z, x, y);
          deleted += 1;
        }
      }
    }
  }
  return deleted;
}

export async function getTilesSizeInBounds(
  bounds: OfflineRegionBounds,
  minZoom: number,
  maxZoomByLayer: Partial<Record<OfflineLayerId, number>>,
): Promise<number> {
  const epsilon = 1e-9;
  const ranges: Record<OfflineLayerId, Map<number, { xMin: number; xMax: number; yMin: number; yMax: number }>> = {
    topo: new Map(),
    steepness: new Map(),
  };
  for (const layer of Object.keys(OFFLINE_LAYERS) as OfflineLayerId[]) {
    const cfg = OFFLINE_LAYERS[layer];
    const layerMaxZoom = Math.min(
      maxZoomByLayer[layer] ?? cfg.maxZoom,
      cfg.maxZoom,
    );
    for (let z = minZoom; z <= layerMaxZoom; z += 1) {
      const max = Math.pow(2, z) - 1;
      const xMinF = lonToTileXFloat(bounds.minLon + epsilon, z);
      const xMaxF = lonToTileXFloat(bounds.maxLon - epsilon, z);
      const yMinF = latToTileYFloat(bounds.maxLat - epsilon, z);
      const yMaxF = latToTileYFloat(bounds.minLat + epsilon, z);
      ranges[layer].set(z, {
        xMin: Math.max(0, Math.floor(Math.min(xMinF, xMaxF))),
        xMax: Math.min(max, Math.floor(Math.max(xMinF, xMaxF))),
        yMin: Math.max(0, Math.floor(Math.min(yMinF, yMaxF))),
        yMax: Math.min(max, Math.floor(Math.max(yMinF, yMaxF))),
      });
    }
  }

  const db = await openDb();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    let total = 0;
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(total);
        return;
      }
      const key = String(cursor.key);
      const parts = key.split("/");
      if (parts.length === 4) {
        const layer = parts[0] as OfflineLayerId;
        const z = Number(parts[1]);
        const x = Number(parts[2]);
        const y = Number(parts[3]);
        const range = ranges[layer]?.get(z);
        if (
          range &&
          x >= range.xMin &&
          x <= range.xMax &&
          y >= range.yMin &&
          y <= range.yMax
        ) {
          const value = cursor.value as ArrayBuffer | undefined;
          if (value) total += value.byteLength;
        }
      }
      cursor.continue();
    };
  });
}
