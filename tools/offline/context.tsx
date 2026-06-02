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
import type { Region } from "react-native-maps";
import { useMap } from "../../map/MapContext";
import { loadOfflineMode, saveOfflineMode } from "../../map/offlineMode";
import {
  boundsIntersect,
  clearTilesInBounds,
  downloadOfflineTiles,
  getOfflineTilesSize,
  listTilesForBounds,
  type DownloadHandle,
  type DownloadProgress,
  type OfflineRegionBounds,
} from "../../map/offlineTiles";
import {
  addSavedRegion,
  loadSavedRegions,
  removeSavedRegions,
  type SavedOfflineRegion,
} from "../../map/savedRegions";

const DEFAULT_MIN_ZOOM = 11;
const DEFAULT_MAX_ZOOM = 15;

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

// Empirical nudge: the visible map area on iOS extends slightly above what
// `region.latitude + latitudeDelta/2` reports (status bar / notch), so the
// dashed orange box lines up with a higher lat than the bounds math thinks.
// Pull the top edge of the downloaded bounds up by this fraction of viewport.
const BOUNDS_TOP_NUDGE = 0.068;

function regionToDownloadBounds(region: Region): OfflineRegionBounds {
  const { horizontal, top, bottom } = DOWNLOAD_BOX_INSETS;
  // Lon is linear in Mercator X.
  const halfLon = region.longitudeDelta / 2;
  const minLon =
    region.longitude - halfLon + region.longitudeDelta * horizontal;
  const maxLon =
    region.longitude + halfLon - region.longitudeDelta * horizontal;
  // Lat is non-linear; convert via Mercator Y.
  const yTop = latToMercatorY(region.latitude + region.latitudeDelta / 2);
  const yBottom = latToMercatorY(region.latitude - region.latitudeDelta / 2);
  const yHeight = yTop - yBottom;
  const maxLat = mercatorYToLat(yTop - yHeight * (top - BOUNDS_TOP_NUDGE));
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
  startDownload: () => void;
  cancelDownload: () => void;
  clearSelection: () => void;
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
    setStorageBytes(getOfflineTilesSize());
  }, []);

  const tiles = useMemo(() => {
    if (!region) return [];
    return listTilesForBounds(
      regionToDownloadBounds(region),
      DEFAULT_MIN_ZOOM,
      DEFAULT_MAX_ZOOM,
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
      .then((result) => {
        if (result.completed > 0) {
          const saved = addSavedRegion(bounds);
          setSavedRegions((prev) => [...prev, saved]);
        }
      })
      .finally(() => {
        setDownloading(false);
        handleRef.current = null;
        setStorageBytes(getOfflineTilesSize());
      });
  }, [downloading, tiles, region]);

  const cancelDownload = useCallback(() => {
    handleRef.current?.cancel();
  }, []);

  const clearSelection = useCallback(() => {
    if (!selectionBounds) return;
    clearTilesInBounds(selectionBounds, DEFAULT_MIN_ZOOM, DEFAULT_MAX_ZOOM);
    const intersectingIds = new Set(
      savedRegions
        .filter((r) => boundsIntersect(r.bounds, selectionBounds))
        .map((r) => r.id),
    );
    if (intersectingIds.size > 0) {
      const remaining = removeSavedRegions(intersectingIds);
      setSavedRegions(remaining);
    }
    setStorageBytes(getOfflineTilesSize());
    setProgress(null);
  }, [selectionBounds, savedRegions]);

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
      startDownload,
      cancelDownload,
      clearSelection,
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
      startDownload,
      cancelDownload,
      clearSelection,
      offlineMode,
      setOfflineMode,
    ],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}
