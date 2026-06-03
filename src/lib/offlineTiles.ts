import maplibregl from "maplibre-gl";
import { KARTVERKET_TOPO_TILES, STEEPNESS_RUNOUT_TILES } from "./tileCache";
import type { LatLng } from "./types";

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
  buf: ArrayBuffer,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(buf, tileKey(layer, z, x, y));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
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
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () =>
      resolve(
        (req.result as IDBValidKey[])
          .map(String)
          .filter((k) => k.startsWith(prefix)),
      );
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// MapLibre custom protocols
// ---------------------------------------------------------------------------

export function registerOfflineProtocols() {
  for (const cfg of Object.values(OFFLINE_LAYERS)) {
    maplibregl.addProtocol(cfg.protocol, async (params) => {
      const url = new URL(params.url);
      // protocol://z/x/y → host=z, pathname=/x/y
      const z = Number(url.host);
      const [, xStr, yStr] = url.pathname.split("/");
      const x = Number(xStr);
      const y = Number(yStr);
      const buf = await getTile(cfg.id, z, x, y);
      if (!buf) {
        throw new Error("Tile not in offline cache");
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

function tileXToLon(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tileYToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export type TileCoord = {
  layer: OfflineLayerId;
  z: number;
  x: number;
  y: number;
};

/** Axis-aligned lat/lon bounding box. Used for fast bbox-vs-bbox tests. */
export type OfflineRegionBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

/**
 * A user-drawn selection polygon. Points are ordered; the last point connects
 * implicitly to the first. Must contain at least 3 points to bound an area.
 */
export type OfflineRegionPolygon = LatLng[];

// ---------------------------------------------------------------------------
// Polygon math
// ---------------------------------------------------------------------------

export function polygonBBox(
  polygon: OfflineRegionPolygon,
): OfflineRegionBounds {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const p of polygon) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  }
  return { minLat, maxLat, minLon, maxLon };
}

/** Standard ray-casting test. Polygon vertices use lon=x, lat=y. */
export function pointInPolygon(
  point: LatLng,
  polygon: OfflineRegionPolygon,
): boolean {
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.longitude;
    const yi = polygon[i]!.latitude;
    const xj = polygon[j]!.longitude;
    const yj = polygon[j]!.latitude;
    const denom = yj - yi || Number.EPSILON;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / denom + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function ccw(a: LatLng, b: LatLng, c: LatLng): number {
  return (
    (b.longitude - a.longitude) * (c.latitude - a.latitude) -
    (b.latitude - a.latitude) * (c.longitude - a.longitude)
  );
}

function segmentsIntersect(
  a: LatLng,
  b: LatLng,
  c: LatLng,
  d: LatLng,
): boolean {
  const d1 = ccw(c, d, a);
  const d2 = ccw(c, d, b);
  const d3 = ccw(a, b, c);
  const d4 = ccw(a, b, d);
  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }
  return false;
}

/**
 * Returns true if any pair of non-adjacent edges of the polygon (closed,
 * implicit edge from last point back to first) cross each other.
 */
export function isPolygonSelfIntersecting(
  polygon: OfflineRegionPolygon,
): boolean {
  const n = polygon.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i += 1) {
    const a1 = polygon[i]!;
    const a2 = polygon[(i + 1) % n]!;
    for (let j = i + 1; j < n; j += 1) {
      // Skip adjacent edges (they share a vertex).
      if ((j + 1) % n === i) continue;
      if (j === (i + 1) % n) continue;
      const b1 = polygon[j]!;
      const b2 = polygon[(j + 1) % n]!;
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
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

/** Does the polygon overlap the given lat/lon rectangle in any way? */
function polygonOverlapsRect(
  polygon: OfflineRegionPolygon,
  rect: OfflineRegionBounds,
): boolean {
  // Quick bbox reject.
  const bbox = polygonBBox(polygon);
  if (!boundsIntersect(bbox, rect)) return false;
  // 1. any polygon vertex inside the rect
  for (const p of polygon) {
    if (
      p.longitude >= rect.minLon &&
      p.longitude <= rect.maxLon &&
      p.latitude >= rect.minLat &&
      p.latitude <= rect.maxLat
    ) {
      return true;
    }
  }
  // 2. any rect corner inside the polygon
  const corners: LatLng[] = [
    { latitude: rect.minLat, longitude: rect.minLon },
    { latitude: rect.minLat, longitude: rect.maxLon },
    { latitude: rect.maxLat, longitude: rect.maxLon },
    { latitude: rect.maxLat, longitude: rect.minLon },
  ];
  for (const c of corners) {
    if (pointInPolygon(c, polygon)) return true;
  }
  // 3. any polygon edge crosses any rect edge
  const rectEdges: [LatLng, LatLng][] = [
    [corners[0]!, corners[1]!],
    [corners[1]!, corners[2]!],
    [corners[2]!, corners[3]!],
    [corners[3]!, corners[0]!],
  ];
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    for (const [r1, r2] of rectEdges) {
      if (segmentsIntersect(polygon[j]!, polygon[i]!, r1, r2)) return true;
    }
  }
  return false;
}

/** Bbox-vs-polygon overlap, used to highlight saved regions touching a selection. */
export function polygonOverlapsBounds(
  polygon: OfflineRegionPolygon,
  bounds: OfflineRegionBounds,
): boolean {
  if (polygon.length < 3) return false;
  return polygonOverlapsRect(polygon, bounds);
}

export function listTilesForPolygon(
  polygon: OfflineRegionPolygon,
  minZoom: number,
  maxZoomByLayer: Partial<Record<OfflineLayerId, number>>,
  layers: OfflineLayerId[],
): TileCoord[] {
  const tiles: TileCoord[] = [];
  if (polygon.length < 3) return tiles;
  const bbox = polygonBBox(polygon);
  for (const layer of layers) {
    const cfg = OFFLINE_LAYERS[layer];
    const layerMaxZoom = Math.min(
      maxZoomByLayer[layer] ?? cfg.maxZoom,
      cfg.maxZoom,
    );
    for (let z = minZoom; z <= layerMaxZoom; z += 1) {
      const max = Math.pow(2, z) - 1;
      const xMinF = lonToTileXFloat(bbox.minLon, z);
      const xMaxF = lonToTileXFloat(bbox.maxLon, z);
      const yMinF = latToTileYFloat(bbox.maxLat, z);
      const yMaxF = latToTileYFloat(bbox.minLat, z);
      const xMin = Math.max(0, Math.floor(xMinF));
      const xMax = Math.min(max, Math.floor(xMaxF));
      const yMin = Math.max(0, Math.floor(yMinF));
      const yMax = Math.min(max, Math.floor(yMaxF));
      for (let x = xMin; x <= xMax; x += 1) {
        for (let y = yMin; y <= yMax; y += 1) {
          const tileRect: OfflineRegionBounds = {
            minLon: tileXToLon(x, z),
            maxLon: tileXToLon(x + 1, z),
            maxLat: tileYToLat(y, z),
            minLat: tileYToLat(y + 1, z),
          };
          if (polygonOverlapsRect(polygon, tileRect)) {
            tiles.push({ layer, z, x, y });
          }
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

export function downloadOfflineTiles(
  tiles: TileCoord[],
  onProgress: (progress: DownloadProgress) => void,
): DownloadHandle {
  let cancelled = false;
  const total = tiles.length;
  let completed = 0;
  let failed = 0;

  const promise = (async () => {
    const CONCURRENCY = 6;
    let cursor = 0;
    async function worker() {
      while (!cancelled && cursor < tiles.length) {
        const tile = tiles[cursor++]!;
        try {
          const res = await fetch(tileUrl(tile), { cache: "no-store" });
          if (!res.ok) throw new Error(`status ${res.status}`);
          const buf = await res.arrayBuffer();
          await putTile(tile.layer, tile.z, tile.x, tile.y, buf);
          completed += 1;
        } catch {
          failed += 1;
        }
        onProgress({ total, completed, failed });
      }
    }
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, tiles.length) },
      () => worker(),
    );
    await Promise.all(workers);
    return { total, completed, failed };
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

export async function clearTilesInPolygon(
  polygon: OfflineRegionPolygon,
  minZoom: number,
  maxZoomByLayer: Partial<Record<OfflineLayerId, number>>,
): Promise<number> {
  if (polygon.length < 3) return 0;
  const bbox = polygonBBox(polygon);
  let deleted = 0;
  for (const layer of Object.keys(OFFLINE_LAYERS) as OfflineLayerId[]) {
    const cfg = OFFLINE_LAYERS[layer];
    const layerMaxZoom = Math.min(
      maxZoomByLayer[layer] ?? cfg.maxZoom,
      cfg.maxZoom,
    );
    const allKeys = await listKeysByPrefix(`${layer}/`);
    for (let z = minZoom; z <= layerMaxZoom; z += 1) {
      const max = Math.pow(2, z) - 1;
      const xMinF = lonToTileXFloat(bbox.minLon, z);
      const xMaxF = lonToTileXFloat(bbox.maxLon, z);
      const yMinF = latToTileYFloat(bbox.maxLat, z);
      const yMaxF = latToTileYFloat(bbox.minLat, z);
      const xMin = Math.max(0, Math.floor(xMinF));
      const xMax = Math.min(max, Math.floor(xMaxF));
      const yMin = Math.max(0, Math.floor(yMinF));
      const yMax = Math.min(max, Math.floor(yMaxF));
      const prefix = `${layer}/${z}/`;
      for (const key of allKeys) {
        if (!key.startsWith(prefix)) continue;
        const parts = key.split("/");
        const x = Number(parts[2]);
        const y = Number(parts[3]);
        if (x < xMin || x > xMax || y < yMin || y > yMax) continue;
        const tileRect: OfflineRegionBounds = {
          minLon: tileXToLon(x, z),
          maxLon: tileXToLon(x + 1, z),
          maxLat: tileYToLat(y, z),
          minLat: tileYToLat(y + 1, z),
        };
        if (!polygonOverlapsRect(polygon, tileRect)) continue;
        await deleteTile(layer, z, x, y);
        deleted += 1;
      }
    }
  }
  return deleted;
}

export async function getTilesSizeInPolygon(
  polygon: OfflineRegionPolygon,
  minZoom: number,
  maxZoomByLayer: Partial<Record<OfflineLayerId, number>>,
): Promise<number> {
  if (polygon.length < 3) return 0;
  const bbox = polygonBBox(polygon);

  /** Per-layer per-zoom xy bbox ranges. Tiles outside this bbox are skipped fast. */
  const ranges: Record<
    OfflineLayerId,
    Map<number, { xMin: number; xMax: number; yMin: number; yMax: number }>
  > = {
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
      const xMinF = lonToTileXFloat(bbox.minLon, z);
      const xMaxF = lonToTileXFloat(bbox.maxLon, z);
      const yMinF = latToTileYFloat(bbox.maxLat, z);
      const yMaxF = latToTileYFloat(bbox.minLat, z);
      ranges[layer].set(z, {
        xMin: Math.max(0, Math.floor(xMinF)),
        xMax: Math.min(max, Math.floor(xMaxF)),
        yMin: Math.max(0, Math.floor(yMinF)),
        yMax: Math.min(max, Math.floor(yMaxF)),
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
          const tileRect: OfflineRegionBounds = {
            minLon: tileXToLon(x, z),
            maxLon: tileXToLon(x + 1, z),
            maxLat: tileYToLat(y, z),
            minLat: tileYToLat(y + 1, z),
          };
          if (polygonOverlapsRect(polygon, tileRect)) {
            const value = cursor.value as ArrayBuffer | undefined;
            if (value) total += value.byteLength;
          }
        }
      }
      cursor.continue();
    };
  });
}
