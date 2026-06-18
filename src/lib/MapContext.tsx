import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { LatLng, Region } from "./types";

export type RegionChangeListener = (region: Region) => void;

/**
 * Backing store for the map's current Region. Updates fire from MapView's
 * `onMove` handler via `setRegion`. Consumers subscribe with either the
 * imperative `subscribeRegionChange` (legacy) or — preferred — the
 * `useMapRegion(selector)` hook backed by `useSyncExternalStore`.
 */
type RegionStore = {
  getSnapshot: () => Region | null;
  subscribe: (listener: () => void) => () => void;
  setRegion: (region: Region) => void;
};

export type MapContextValue = {
  mapRef: MutableRefObject<MapLibreMap | null>;
  cursorCoordinate: MutableRefObject<LatLng>;
  /**
   * Imperative subscription to region changes. Prefer `useMapRegion(selector)`
   * for new code — it integrates with React concurrency via
   * `useSyncExternalStore`.
   */
  subscribeRegionChange: (listener: RegionChangeListener) => () => void;
  /** Internal: called by MapView when the map moves. */
  _publishRegion: (region: Region) => void;
  /** Internal: snapshot accessor, used by useMapRegion. */
  _regionStore: RegionStore;
};

const MapContext = createContext<MapContextValue | null>(null);

const FALLBACK_COORD: LatLng = { latitude: 60.3913, longitude: 5.3221 };

type MapContextProviderProps = {
  /** Optional initial cursor coordinate (e.g. from persisted last region). */
  initialCursor?: LatLng;
  children: ReactNode;
};

export function MapContextProvider({
  initialCursor,
  children,
}: MapContextProviderProps) {
  const mapRef = useRef<MapLibreMap | null>(null);
  const cursorCoordinate = useRef<LatLng>(initialCursor ?? FALLBACK_COORD);

  // Legacy listener Set (imperative subscribers).
  const regionListeners = useRef(new Set<RegionChangeListener>());
  // useSyncExternalStore listeners.
  const storeListeners = useRef(new Set<() => void>());
  const regionRef = useRef<Region | null>(null);

  const subscribeRegionChange = useCallback(
    (listener: RegionChangeListener) => {
      regionListeners.current.add(listener);
      return () => {
        regionListeners.current.delete(listener);
      };
    },
    [],
  );

  const regionStore = useMemo<RegionStore>(
    () => ({
      getSnapshot: () => regionRef.current,
      subscribe: (listener) => {
        storeListeners.current.add(listener);
        return () => {
          storeListeners.current.delete(listener);
        };
      },
      setRegion: (region) => {
        regionRef.current = region;
        storeListeners.current.forEach((l) => l());
      },
    }),
    [],
  );

  const publishRegion = useCallback((region: Region) => {
    regionRef.current = region;
    regionListeners.current.forEach((l) => l(region));
    storeListeners.current.forEach((l) => l());
  }, []);

  const value = useMemo<MapContextValue>(
    () => ({
      mapRef,
      cursorCoordinate,
      subscribeRegionChange,
      _publishRegion: publishRegion,
      _regionStore: regionStore,
    }),
    [subscribeRegionChange, publishRegion, regionStore],
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMap(): MapContextValue {
  const value = useContext(MapContext);
  if (!value) {
    throw new Error("useMap must be used within a MapContextProvider");
  }
  return value;
}

/**
 * Subscribe to the current map Region with a selector. Re-renders only when
 * the selected value changes (compared with `Object.is` by default).
 *
 * Pass `undefined` selector to receive the full Region; selectors are cheaper
 * when they return a primitive (e.g. zoom-style numbers).
 */
export function useMapRegion(): Region | null;
export function useMapRegion<T>(
  selector: (region: Region | null) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useMapRegion<T>(
  selector?: (region: Region | null) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T | Region | null {
  const { _regionStore } = useMap();
  // Cache the last derived value so referential equality holds across
  // unrelated region updates.
  const lastRef = useRef<{ source: Region | null; derived: T } | null>(null);

  const getSnapshot = useCallback((): T | Region | null => {
    const region = _regionStore.getSnapshot();
    if (!selector) return region;
    if (lastRef.current && lastRef.current.source === region) {
      return lastRef.current.derived;
    }
    const derived = selector(region);
    if (lastRef.current && isEqual(lastRef.current.derived, derived)) {
      lastRef.current = { source: region, derived: lastRef.current.derived };
      return lastRef.current.derived;
    }
    lastRef.current = { source: region, derived };
    return derived;
  }, [_regionStore, selector, isEqual]);

  return useSyncExternalStore(_regionStore.subscribe, getSnapshot, getSnapshot);
}
