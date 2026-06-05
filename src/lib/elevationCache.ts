import type { ElevationGrid, LatLng } from "./types";

const DB_NAME = "tur-vibes-elevation";
const DB_VERSION = 1;
const STORE = "grids";

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

function gridKey(lat: number, lon: number, radius: number, size: number) {
  return `grid_${lat.toFixed(4)}_${lon.toFixed(4)}_${radius}_${size}`;
}

export async function cacheElevationGrid(grid: ElevationGrid): Promise<void> {
  const db = await openDb();
  const key = gridKey(
    grid.center.latitude,
    grid.center.longitude,
    grid.radiusMeters,
    grid.gridSize,
  );
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(grid, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedElevationGrid(
  center: LatLng,
  radiusMeters: number,
  gridSize: number,
): Promise<ElevationGrid | null> {
  const db = await openDb();
  const key = gridKey(
    center.latitude,
    center.longitude,
    radiusMeters,
    gridSize,
  );
  return new Promise<ElevationGrid | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as ElevationGrid) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearElevationCache(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
