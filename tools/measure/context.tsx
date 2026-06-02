import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LatLng } from "react-native-maps";
import { useMap } from "../../map/MapContext";

type MarkerPosition = { x: number; y: number };

type MeasureContextValue = {
  points: LatLng[];
  markerPositions: MarkerPosition[];
  addPoint: () => void;
  removeLastPoint: () => void;
  clear: () => void;
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
  const { mapRef, cursorCoordinate, subscribeRegionChange } = useMap();
  const [points, setPoints] = useState<LatLng[]>([]);
  const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([]);

  const updateMarkerPositions = useCallback(
    async (nextPoints: LatLng[]) => {
      if (!mapRef.current || nextPoints.length === 0) {
        setMarkerPositions([]);
        return;
      }
      const positions = await Promise.all(
        nextPoints.map((point) => mapRef.current!.pointForCoordinate(point)),
      );
      setMarkerPositions(positions);
    },
    [mapRef],
  );

  useEffect(() => {
    return subscribeRegionChange(() => {
      updateMarkerPositions(points);
    });
  }, [points, subscribeRegionChange, updateMarkerPositions]);

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
  }, []);

  const value = useMemo(
    () => ({ points, markerPositions, addPoint, removeLastPoint, clear }),
    [points, markerPositions, addPoint, removeLastPoint, clear],
  );

  return (
    <MeasureContext.Provider value={value}>{children}</MeasureContext.Provider>
  );
}
