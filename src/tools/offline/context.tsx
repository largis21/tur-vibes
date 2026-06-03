import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMap } from "../../lib/MapContext";
import { loadOfflineMode, saveOfflineMode } from "../../lib/offlineMode";
import {
  clearTilesInBounds,
  downloadOfflineTiles,
  getOfflineTilesSize,
  getTilesSizeInBounds,
  listTilesForBounds,
  type DownloadHandle,
  type DownloadProgress,
  type OfflineRegionBounds,
} from "../../lib/offlineTiles";
import {
  addSavedRegion,
  loadSavedRegions,
  removeSavedRegions,
  type SavedOfflineRegion,
} from "../../lib/savedRegions";
import type { Region } from "../../lib/types";

const DEFAULT_MIN_ZOOM = 11;
const DEFAULT_MAX_ZOOM_BY_LAYER = {
  topo: 16,
  steepness: 15,
} as const;

// Ratio insets matching the dotted box overlay (relative to map viewport).
export const DOWNLOAD_BOX_INSETS = {
  horizontal: 0.05,
  top: 0.08,
  bottom: 0.35,
};

function latToMercatorY(lat: number) {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function mercatorYToLat(y: number) {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}

function regionToDownloadBounds(region: Region): OfflineRegionBounds {
  const { horizontal, top, bottom } = DOWNLOAD_BOX_INSETS;
  const halfLon = region.longitudeDelta / 2;
  const minLon =
    region.longitude - halfLon + region.longitudeDelta * horizontal;
  const maxLon =
    region.longitude + halfLon - region.longitudeDelta * horizontal;
  const yTop = latToMercatorY(region.latitude + region.latitudeDelta / 2);
  const yBottom = latToMercatorY(region.latitude - region.latitudeDelta / 2);
  const yHeight = yTop - yBottom;
  const maxLat = mercatorYToLat(yTop - yHeight * top);
  const minLat = mercatorYToLat(yBottom + yHeight * bottom);
  return { minLat, maxLat, minLon, maxLon };
}

export type OfflineContextValue = {
  region: Region | null;
  selectionBounds: OfflineRegionBounds | null;
  tileCount: number;
  downloading: boolean;
  progress: DownloadProgress | null;
  storageBytes: number;
  savedRegions: SavedOfflineRegion[];
  /** Bytes used by each saved region, keyed by region id. Loads asynchronously. */
  regionSizes: Record<string, number>;
  startDownload: () => void;
  cancelDownload: () => void;
  removeSavedRegion: (id: string) => Promise<void>;
  offlineMode: boolean;
  setOfflineMode: (enabled: boolean) => void;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function useOffline() {
  const value = useContext(OfflineContext);
  if (!value) throw new Error("useOffline must be used within OfflineProvider");
  return value;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { subscribeRegionChange, cursorCoordinate } = useMap();
  const [region, setRegion] = useState<Region | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [storageBytes, setStorageBytes] = useState(0);
  const [savedRegions, setSavedRegions] = useState<SavedOfflineRegion[]>(() =>
    loadSavedRegions(),
  );
  const [offlineMode, setOfflineModeState] = useState<boolean>(() =>
    loadOfflineMode(),
  );
  const [regionSizes, setRegionSizes] = useState<Record<string, number>>({});
  const handleRef = useRef<DownloadHandle | null>(null);

  useEffect(() => {
    return subscribeRegionChange((r) => setRegion(r));
  }, [subscribeRegionChange]);

  useEffect(() => {
    if (region) return;
    setRegion({
      latitude: cursorCoordinate.current.latitude,
      longitude: cursorCoordinate.current.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
  }, [region, cursorCoordinate]);

  useEffect(() => {
    let cancelled = false;
    getOfflineTilesSize().then((b) => {
      if (!cancelled) setStorageBytes(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Recompute per-region sizes whenever the saved-region list changes or a
  // download finishes (storageBytes acts as a proxy for "tile contents may
  // have changed").
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, number> = {};
      for (const region of savedRegions) {
        if (cancelled) return;
        next[region.id] = await getTilesSizeInBounds(
          region.bounds,
          DEFAULT_MIN_ZOOM,
          DEFAULT_MAX_ZOOM_BY_LAYER,
        );
      }
      if (!cancelled) setRegionSizes(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [savedRegions, storageBytes]);

  const tiles = useMemo(() => {
    if (!region) return [];
    return listTilesForBounds(
      regionToDownloadBounds(region),
      DEFAULT_MIN_ZOOM,
      DEFAULT_MAX_ZOOM_BY_LAYER,
      ["topo", "steepness"],
    );
  }, [region]);

  const selectionBounds = useMemo<OfflineRegionBounds | null>(() => {
    if (!region) return null;
    return regionToDownloadBounds(region);
  }, [region]);

  const startDownload = useCallback(() => {
    if (downloading || tiles.length === 0 || !region) return;
    const bounds = regionToDownloadBounds(region);
    setDownloading(true);
    setProgress({ total: tiles.length, completed: 0, failed: 0 });
    const handle = downloadOfflineTiles(tiles, (p) => setProgress(p));
    handleRef.current = handle;
    handle.promise
      .then(async (result) => {
        if (result.completed > 0) {
          const saved = addSavedRegion(bounds);
          setSavedRegions((prev) => [...prev, saved]);
        }
      })
      .finally(async () => {
        setDownloading(false);
        handleRef.current = null;
        setStorageBytes(await getOfflineTilesSize());
      });
  }, [downloading, tiles, region]);

  const cancelDownload = useCallback(() => {
    handleRef.current?.cancel();
  }, []);

  const removeSavedRegion = useCallback(
    async (id: string) => {
      const target = savedRegions.find((r) => r.id === id);
      if (!target) return;
      await clearTilesInBounds(
        target.bounds,
        DEFAULT_MIN_ZOOM,
        DEFAULT_MAX_ZOOM_BY_LAYER,
      );
      const remaining = removeSavedRegions(new Set([id]));
      setSavedRegions(remaining);
      setStorageBytes(await getOfflineTilesSize());
    },
    [savedRegions],
  );

  const setOfflineMode = useCallback((enabled: boolean) => {
    setOfflineModeState(enabled);
    saveOfflineMode(enabled);
  }, []);

  const value = useMemo<OfflineContextValue>(
    () => ({
      region,
      selectionBounds,
      tileCount: tiles.length,
      downloading,
      progress,
      storageBytes,
      savedRegions,
      regionSizes,
      startDownload,
      cancelDownload,
      removeSavedRegion,
      offlineMode,
      setOfflineMode,
    }),
    [
      region,
      selectionBounds,
      tiles.length,
      downloading,
      progress,
      storageBytes,
      savedRegions,
      regionSizes,
      startDownload,
      cancelDownload,
      removeSavedRegion,
      offlineMode,
      setOfflineMode,
    ],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}
