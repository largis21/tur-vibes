import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchNearestPlaceName,
  fetchPointInfo,
  type PointInfo,
} from "./elevation";
import type { LatLng } from "./types";
import { useMap } from "./MapContext";

type PointInfoContextValue = {
  point: LatLng | null;
  info: PointInfo | null;
  placeName: string | null;
  loading: boolean;
  error: string | null;
  open: (p: LatLng) => void;
  close: () => void;
  showAspectArrow: boolean;
  toggleAspectArrow: () => void;
};

const PointInfoContext = createContext<PointInfoContextValue | null>(null);

export function PointInfoProvider({ children }: { children: ReactNode }) {
  const { mapRef } = useMap();
  const [point, setPoint] = useState<LatLng | null>(null);
  const [info, setInfo] = useState<PointInfo | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAspectArrow, setShowAspectArrow] = useState(false);

  const open = useCallback(
    (p: LatLng) => {
      setPoint(p);
      const map = mapRef.current;
      if (!map) return;

      map.panTo([p.longitude, p.latitude], { duration: 150 });
    },
    [mapRef],
  );
  const close = useCallback(() => setPoint(null), []);
  const toggleAspectArrow = useCallback(
    () => setShowAspectArrow((prev) => !prev),
    [],
  );

  useEffect(() => {
    if (!point) {
      setInfo(null);
      setPlaceName(null);
      setError(null);
      setLoading(false);
      setShowAspectArrow(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    setInfo(null);
    setPlaceName(null);
    fetchPointInfo(point, 30, ctrl.signal)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setInfo(res);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    fetchNearestPlaceName(point, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        if (!result) {
          setPlaceName(null);
          return;
        }
        const dist = result.distanceM;
        const distStr =
          dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`;
        setPlaceName(`${result.name} (${result.type}, ${distStr})`);
      })
      .catch(() => {
        /* non-critical, ignore */
      });
    return () => ctrl.abort();
  }, [point]);

  const value = useMemo(
    () => ({
      point,
      info,
      placeName,
      loading,
      error,
      open,
      close,
      showAspectArrow,
      toggleAspectArrow,
    }),
    [point, info, placeName, loading, error, showAspectArrow],
  );

  return (
    <PointInfoContext.Provider value={value}>
      {children}
    </PointInfoContext.Provider>
  );
}

export function usePointInfo(): PointInfoContextValue {
  const value = useContext(PointInfoContext);
  if (!value) {
    throw new Error("usePointInfo must be used within PointInfoProvider");
  }
  return value;
}
