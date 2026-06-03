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
  clearTilesInPolygon,
  downloadOfflineTiles,
  getOfflineTilesSize,
  getTilesSizeInPolygon,
  isPolygonSelfIntersecting,
  listTilesForPolygon,
  type DownloadHandle,
  type DownloadProgress,
} from "../../lib/offlineTiles";
import {
  addSavedRegion,
  loadSavedRegions,
  removeSavedRegions,
  type SavedOfflineRegion,
} from "../../lib/savedRegions";
import type { LatLng } from "../../lib/types";

const DEFAULT_MIN_ZOOM = 11;
const DEFAULT_MAX_ZOOM_BY_LAYER = {
  topo: 16,
  steepness: 15,
} as const;

export type OfflineContextValue = {
  polygon: LatLng[];
  addPolygonPoint: () => void;
  updatePolygonPoint: (index: number, point: LatLng) => void;
  removeLastPolygonPoint: () => void;
  clearPolygon: () => void;
  /** True if the polygon's edges cross themselves – the area is invalid. */
  selfIntersecting: boolean;
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
  const { cursorCoordinate } = useMap();
  const [polygon, setPolygon] = useState<LatLng[]>([]);
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
        next[region.id] = await getTilesSizeInPolygon(
          region.polygon,
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

  const selfIntersecting = useMemo(
    () => isPolygonSelfIntersecting(polygon),
    [polygon],
  );

  const tiles = useMemo(() => {
    if (polygon.length < 3) return [];
    if (selfIntersecting) return [];
    return listTilesForPolygon(
      polygon,
      DEFAULT_MIN_ZOOM,
      DEFAULT_MAX_ZOOM_BY_LAYER,
      ["topo", "steepness"],
    );
  }, [polygon, selfIntersecting]);

  const addPolygonPoint = useCallback(() => {
    setPolygon((cur) => [...cur, { ...cursorCoordinate.current }]);
  }, [cursorCoordinate]);

  const updatePolygonPoint = useCallback((index: number, point: LatLng) => {
    setPolygon((cur) => {
      if (index < 0 || index >= cur.length) return cur;
      const next = cur.slice();
      next[index] = point;
      return next;
    });
  }, []);

  const removeLastPolygonPoint = useCallback(() => {
    setPolygon((cur) => cur.slice(0, -1));
  }, []);

  const clearPolygon = useCallback(() => {
    setPolygon([]);
  }, []);

  const startDownload = useCallback(() => {
    if (
      downloading ||
      tiles.length === 0 ||
      polygon.length < 3 ||
      selfIntersecting
    )
      return;
    const snapshot = polygon.slice();
    setDownloading(true);
    setProgress({ total: tiles.length, completed: 0, failed: 0 });
    const handle = downloadOfflineTiles(tiles, (p) => setProgress(p));
    handleRef.current = handle;
    handle.promise
      .then(async (result) => {
        if (result.completed > 0) {
          const saved = addSavedRegion(snapshot);
          setSavedRegions((prev) => [...prev, saved]);
          setPolygon([]);
        }
      })
      .finally(async () => {
        setDownloading(false);
        handleRef.current = null;
        setStorageBytes(await getOfflineTilesSize());
      });
  }, [downloading, tiles, polygon, selfIntersecting]);

  const cancelDownload = useCallback(() => {
    handleRef.current?.cancel();
  }, []);

  const removeSavedRegion = useCallback(
    async (id: string) => {
      const target = savedRegions.find((r) => r.id === id);
      if (!target) return;
      await clearTilesInPolygon(
        target.polygon,
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
      polygon,
      addPolygonPoint,
      updatePolygonPoint,
      removeLastPolygonPoint,
      clearPolygon,
      selfIntersecting,
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
      polygon,
      addPolygonPoint,
      updatePolygonPoint,
      removeLastPolygonPoint,
      clearPolygon,
      selfIntersecting,
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
