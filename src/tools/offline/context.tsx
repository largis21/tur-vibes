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
  deleteTilesExclusiveTo,
  downloadOfflineTiles,
  getOfflineTilesSize,
  getTilesSizeInPolygon,
  isPolygonSelfIntersecting,
  listTilesForPolygon,
  tileKey,
  type DownloadHandle,
  type DownloadProgress,
} from "../../lib/offlineTiles";
import {
  addSavedRegion,
  loadSavedRegions,
  removeSavedRegions,
  type SavedOfflineRegion,
} from "../../lib/savedRegions";
import { sourcesIntersecting } from "../../lib/mapSources";
import type { LatLng } from "../../lib/types";

const DEFAULT_MIN_ZOOM = 11;
export const DEFAULT_MAX_ZOOM_BY_SOURCE = {
  topo: 16,
  steepness: 15,
  "npolars-svalbard": 16,
  "npolars-janmayen": 15,
  satellite: 16,
} as const;

export const OFFLINE_MIN_ZOOM = DEFAULT_MIN_ZOOM;

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
  /** Selected source IDs for this download (basemaps + overlays). */
  selectedSourceIds: string[];
  /** Toggle a source on/off. */
  toggleSourceSelection: (sourceId: string) => void;
  /** Custom max zoom level for each source. */
  customMaxZoom: Record<string, number>;
  /** Update max zoom for a source. */
  setMaxZoomForSource: (sourceId: string, maxZoom: number) => void;
  /** All applicable sources for the current polygon. */
  applicableSourceIds: string[];
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
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [customMaxZoom, setCustomMaxZoom] = useState<Record<string, number>>(
    {},
  );
  const handleRef = useRef<DownloadHandle | null>(null);

  // Define the public setter early so it can be used in effects below.
  const setOfflineMode = useCallback((enabled: boolean) => {
    setOfflineModeState(enabled);
    saveOfflineMode(enabled);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getOfflineTilesSize().then((b) => {
      if (!cancelled) setStorageBytes(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Automatically enable offline mode when the browser goes offline
  useEffect(() => {
    const handleOffline = () => {
      setOfflineMode(true);
    };

    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOfflineMode]);

  // Recompute per-region sizes whenever the saved-region list changes or a
  // download finishes (storageBytes acts as a proxy for "tile contents may
  // have changed").
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, number> = {};
      for (const region of savedRegions) {
        if (cancelled) return;
        // Use per-region zoom settings if available (new regions), otherwise fall back
        const zoomMap =
          Object.keys(region.maxZoomBySource).length > 0
            ? region.maxZoomBySource
            : DEFAULT_MAX_ZOOM_BY_SOURCE;
        next[region.id] = await getTilesSizeInPolygon(
          region.polygon,
          region.minZoom,
          zoomMap,
          region.sourceIds,
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

  /**
   * Which sources' bounds intersect this polygon.
   * For basemaps, only includes those with geographic coverage over the polygon.
   * For overlays, includes all applicable overlays.
   */
  const applicableSourceIds = useMemo(() => {
    if (polygon.length < 3) return [];
    return sourcesIntersecting(polygon).map((s) => s.id);
  }, [polygon]);

  // Initialize selectedSourceIds when applicable sources change (and polygon becomes valid)
  useEffect(() => {
    if (polygon.length < 3) {
      setSelectedSourceIds([]);
      setCustomMaxZoom({});
    } else if (applicableSourceIds.length > 0) {
      setSelectedSourceIds((prev) => {
        // Keep existing selections that are still applicable
        const stillApplicable = prev.filter((id) =>
          applicableSourceIds.includes(id),
        );
        // If nothing is selected, select all applicable sources
        if (stillApplicable.length === 0) return applicableSourceIds;
        return stillApplicable;
      });
    }
  }, [applicableSourceIds, polygon.length]);

  const tiles = useMemo(() => {
    if (polygon.length < 3) return [];
    if (selfIntersecting) return [];

    // Build max zoom map with custom overrides
    const maxZoomMap: Record<string, number> = {
      ...DEFAULT_MAX_ZOOM_BY_SOURCE,
    };
    for (const [sourceId, zoom] of Object.entries(customMaxZoom)) {
      maxZoomMap[sourceId] = zoom;
    }

    return listTilesForPolygon(
      polygon,
      DEFAULT_MIN_ZOOM,
      maxZoomMap as typeof DEFAULT_MAX_ZOOM_BY_SOURCE,
      selectedSourceIds,
    );
  }, [polygon, selfIntersecting, selectedSourceIds, customMaxZoom]);

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

  const toggleSourceSelection = useCallback((sourceId: string) => {
    setSelectedSourceIds((prev) => {
      if (prev.includes(sourceId)) {
        return prev.filter((id) => id !== sourceId);
      }
      return [...prev, sourceId];
    });
  }, []);

  const setMaxZoomForSource = useCallback(
    (sourceId: string, maxZoom: number) => {
      setCustomMaxZoom((prev) => ({
        ...prev,
        [sourceId]: maxZoom,
      }));
    },
    [],
  );

  const startDownload = useCallback(() => {
    if (
      downloading ||
      tiles.length === 0 ||
      polygon.length < 3 ||
      selfIntersecting
    )
      return;
    const snapshot = polygon.slice();
    const sourceSnapshot = selectedSourceIds.slice();
    // Capture the exact tile keys and zoom settings for accurate future deletion
    const tileKeySnapshot = tiles.map((t) => tileKey(t.sourceId, t.z, t.x, t.y));
    const maxZoomSnapshot: Record<string, number> = { ...DEFAULT_MAX_ZOOM_BY_SOURCE };
    for (const [sourceId, zoom] of Object.entries(customMaxZoom)) {
      maxZoomSnapshot[sourceId] = zoom;
    }
    // Restrict to only selected sources
    const activeMaxZoom: Record<string, number> = {};
    for (const sourceId of sourceSnapshot) {
      activeMaxZoom[sourceId] = maxZoomSnapshot[sourceId] ?? DEFAULT_MAX_ZOOM_BY_SOURCE[sourceId as keyof typeof DEFAULT_MAX_ZOOM_BY_SOURCE] ?? 16;
    }
    setDownloading(true);
    setProgress({ total: tiles.length, completed: 0, failed: 0 });
    const handle = downloadOfflineTiles(tiles, (p) => setProgress(p));
    handleRef.current = handle;
    handle.promise
      .then(async (result) => {
        if (result.completed > 0) {
          const saved = addSavedRegion(
            snapshot,
            sourceSnapshot,
            tileKeySnapshot,
            DEFAULT_MIN_ZOOM,
            activeMaxZoom,
          );
          setSavedRegions((prev) => [...prev, saved]);
          setPolygon([]);
        }
      })
      .finally(async () => {
        setDownloading(false);
        handleRef.current = null;
        setStorageBytes(await getOfflineTilesSize());
      });
  }, [downloading, tiles, polygon, selfIntersecting, selectedSourceIds, customMaxZoom]);

  const cancelDownload = useCallback(() => {
    handleRef.current?.cancel();
  }, []);

  const removeSavedRegion = useCallback(
    async (id: string) => {
      // Read from source-of-truth (localStorage) to avoid stale-closure bug
      const allRegions = loadSavedRegions();
      const target = allRegions.find((r) => r.id === id);
      if (!target) return;
      const otherRegions = allRegions.filter((r) => r.id !== id);

      if (target.tileKeys.length > 0) {
        // New-style region: delete only tiles not used by another region
        await deleteTilesExclusiveTo(
          target.tileKeys,
          otherRegions.map((r) => r.tileKeys),
        );
      } else {
        // Legacy region: fall back to geometry-based deletion
        const zoomMap =
          Object.keys(target.maxZoomBySource).length > 0
            ? target.maxZoomBySource
            : DEFAULT_MAX_ZOOM_BY_SOURCE;
        await clearTilesInPolygon(
          target.polygon,
          target.minZoom,
          zoomMap,
          target.sourceIds,
        );
      }

      const remaining = removeSavedRegions(new Set([id]));
      setSavedRegions(remaining);
      setStorageBytes(await getOfflineTilesSize());
    },
    [],
  );

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
      selectedSourceIds,
      toggleSourceSelection,
      customMaxZoom,
      setMaxZoomForSource,
      applicableSourceIds,
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
      selectedSourceIds,
      toggleSourceSelection,
      customMaxZoom,
      setMaxZoomForSource,
      applicableSourceIds,
    ],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}
