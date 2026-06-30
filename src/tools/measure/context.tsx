import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMap, useMapRegion } from "../../lib/MapContext";
import type { LatLng } from "../../lib/types";
import { fetchElevations } from "../../lib/elevation";
import { getTotalDistanceMeters, samplePointsAlongPath } from "../../lib/geo";

type MarkerPosition = { x: number; y: number };

export type ElevationSample = {
  distanceMeters: number;
  elevation: number | null;
};

type MeasureContextValue = {
  points: LatLng[];
  markerPositions: MarkerPosition[];
  cursorPosition: LatLng;
  addPoint: () => void;
  removeLastPoint: () => void;
  clear: () => void;
  elevationProfile: ElevationSample[] | null;
  elevationLoading: boolean;
};

const MeasureContext = createContext<MeasureContextValue | null>(null);

export function useMeasure(): MeasureContextValue {
  const value = useContext(MeasureContext);
  if (!value) {
    throw new Error("useMeasure must be used within a MeasureProvider");
  }
  return value;
}

export function MeasureProvider({ children }: { children: ReactNode }) {
  const { mapRef, cursorCoordinate } = useMap();
  const [points, setPoints] = useState<LatLng[]>([]);
  const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([]);
  const [elevationProfile, setElevationProfile] = useState<
    ElevationSample[] | null
  >(null);
  const [elevationLoading, setElevationLoading] = useState(false);

  // Re-render whenever the cursor (map center) lat/lon changes.
  const cursorPosition = useMapRegion<LatLng>(
    (region) => {
      if (!region) return { ...cursorCoordinate.current };
      return { latitude: region.latitude, longitude: region.longitude };
    },
    (a, b) => a.latitude === b.latitude && a.longitude === b.longitude,
  );

  const updateMarkerPositions = useCallback(
    (nextPoints: LatLng[]) => {
      const map = mapRef.current;
      if (!map || nextPoints.length === 0) {
        setMarkerPositions([]);
        return;
      }
      const positions = nextPoints.map((point) => {
        const projected = map.project([point.longitude, point.latitude]);
        return { x: projected.x, y: projected.y };
      });
      setMarkerPositions(positions);
    },
    [mapRef],
  );

  // Re-project measurement markers whenever the map cursor moves.
  useEffect(() => {
    updateMarkerPositions(points);
  }, [cursorPosition, points, updateMarkerPositions]);

  const addPoint = useCallback(() => {
    setPoints((current) => {
      const next = [...current, { ...cursorCoordinate.current }];
      updateMarkerPositions(next);
      return next;
    });
  }, [cursorCoordinate, updateMarkerPositions]);

  const removeLastPoint = useCallback(() => {
    setPoints((current) => {
      const next = current.slice(0, -1);
      updateMarkerPositions(next);
      return next;
    });
  }, [updateMarkerPositions]);

  const clear = useCallback(() => {
    setPoints([]);
    setMarkerPositions([]);
    setElevationProfile(null);
  }, []);

  // Fetch elevation profile whenever the committed points change.
  useEffect(() => {
    if (points.length < 2) {
      setElevationProfile(null);
      return;
    }
    const totalDist = getTotalDistanceMeters(points);
    const sampleCount = Math.min(60, Math.max(10, Math.round(totalDist / 100)));
    const sampledPoints = samplePointsAlongPath(points, sampleCount);

    const controller = new AbortController();
    setElevationLoading(true);

    fetchElevations(sampledPoints, controller.signal)
      .then((elevations) => {
        const profile: ElevationSample[] = sampledPoints.map((_, i) => ({
          distanceMeters: (i / (sampleCount - 1)) * totalDist,
          elevation: elevations[i],
        }));
        setElevationProfile(profile);
      })
      .catch(() => {
        // Ignore aborted requests
      })
      .finally(() => {
        setElevationLoading(false);
      });

    return () => controller.abort();
  }, [points]);

  const value = useMemo(
    () => ({
      points,
      markerPositions,
      cursorPosition,
      addPoint,
      removeLastPoint,
      clear,
      elevationProfile,
      elevationLoading,
    }),
    [
      points,
      markerPositions,
      cursorPosition,
      addPoint,
      removeLastPoint,
      clear,
      elevationProfile,
      elevationLoading,
    ],
  );

  return (
    <MeasureContext.Provider value={value}>{children}</MeasureContext.Provider>
  );
}
