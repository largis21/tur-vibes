import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMap } from "../../lib/MapContext";
import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from "../../lib/storage";
import type { LatLng } from "../../lib/types";

function isBearing(value: unknown): value is Bearing {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  const point = b.point as Record<string, unknown> | undefined;
  return (
    typeof b.id === "string" &&
    typeof b.heading === "number" &&
    point != null &&
    typeof point.latitude === "number" &&
    typeof point.longitude === "number"
  );
}

function loadBearings(): Bearing[] {
  const raw = safeGetJSON<unknown>(STORAGE_KEYS.navigationBearings, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isBearing);
}

function saveBearings(bearings: Bearing[]) {
  safeSetJSON(STORAGE_KEYS.navigationBearings, bearings);
}

export type Bearing = {
  id: string;
  point: LatLng;
  /** Heading in degrees, 0 = true north, clockwise. */
  heading: number;
};

export type SubToolId = "bearing";

type NavigationContextValue = {
  subToolId: SubToolId;
  setSubToolId: (id: SubToolId) => void;

  bearings: Bearing[];
  selectedBearingId: string | null;
  selectBearing: (id: string | null) => void;
  addBearing: () => void;
  removeBearing: (id: string) => void;
  setBearingHeading: (id: string, heading: number) => void;
  clearBearings: () => void;

  /** Whether device-compass tracking is active. */
  tracking: boolean;
  setTracking: (v: boolean) => void;
  /** Current device heading in degrees (0 = north, CW). null until first reading. */
  deviceHeading: number | null;
  /** Current geolocation fix while tracking is active. */
  userPosition: LatLng | null;
  /**
   * Captures the current deviceHeading as a new bearing at userPosition
   * (falls back to the map cursor) and deactivates tracking.
   */
  captureTrackingBearing: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigation(): NavigationContextValue {
  const value = useContext(NavigationContext);
  if (!value) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return value;
}

function makeId() {
  return `b-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { cursorCoordinate } = useMap();
  const [subToolId, setSubToolId] = useState<SubToolId>("bearing");
  const [bearings, setBearings] = useState<Bearing[]>(() => loadBearings());
  const [selectedBearingId, setSelectedBearingId] = useState<string | null>(
    null,
  );
  const [tracking, setTracking] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [userPosition, setUserPosition] = useState<LatLng | null>(null);

  // Geolocation watch while tracking is active.
  useEffect(() => {
    if (!tracking) {
      setUserPosition(null);
      return;
    }
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (p) =>
        setUserPosition({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking]);

  useEffect(() => {
    if (!tracking) {
      setDeviceHeading(null);
      return;
    }
    function handleOrientation(e: DeviceOrientationEvent) {
      // iOS exposes webkitCompassHeading (0 = north, increasing clockwise).
      const ios = (
        e as DeviceOrientationEvent & { webkitCompassHeading?: number }
      ).webkitCompassHeading;
      if (ios != null) {
        setDeviceHeading(ios);
        return;
      }
      // Android absolute: alpha is degrees CCW from north → convert to CW.
      if (e.alpha != null) {
        setDeviceHeading((360 - e.alpha) % 360);
      }
    }
    window.addEventListener(
      "deviceorientationabsolute",
      handleOrientation as EventListener,
    );
    window.addEventListener(
      "deviceorientation",
      handleOrientation as EventListener,
    );
    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation as EventListener,
      );
      window.removeEventListener(
        "deviceorientation",
        handleOrientation as EventListener,
      );
    };
  }, [tracking]);

  useEffect(() => {
    saveBearings(bearings);
  }, [bearings]);

  const addBearing = useCallback(() => {
    const id = makeId();
    setBearings((current) => [
      ...current,
      { id, point: { ...cursorCoordinate.current }, heading: 0 },
    ]);
    setSelectedBearingId(id);
  }, [cursorCoordinate]);

  const removeBearing = useCallback((id: string) => {
    setBearings((current) => current.filter((b) => b.id !== id));
    setSelectedBearingId((current) => (current === id ? null : current));
  }, []);

  const setBearingHeading = useCallback((id: string, heading: number) => {
    const normalized = ((heading % 360) + 360) % 360;
    setBearings((current) =>
      current.map((b) => (b.id === id ? { ...b, heading: normalized } : b)),
    );
  }, []);

  const clearBearings = useCallback(() => {
    setBearings([]);
    setSelectedBearingId(null);
  }, []);

  const captureTrackingBearing = useCallback(() => {
    if (deviceHeading === null) return;
    const origin = userPosition ?? { ...cursorCoordinate.current };
    const id = makeId();
    setBearings((current) => [
      ...current,
      { id, point: origin, heading: deviceHeading },
    ]);
    setSelectedBearingId(id);
    setTracking(false);
  }, [deviceHeading, userPosition, cursorCoordinate]);

  const value = useMemo<NavigationContextValue>(
    () => ({
      subToolId,
      setSubToolId,
      bearings,
      selectedBearingId,
      selectBearing: setSelectedBearingId,
      addBearing,
      removeBearing,
      setBearingHeading,
      clearBearings,
      tracking,
      setTracking,
      deviceHeading,
      userPosition,
      captureTrackingBearing,
    }),
    [
      subToolId,
      bearings,
      selectedBearingId,
      addBearing,
      removeBearing,
      setBearingHeading,
      clearBearings,
      tracking,
      deviceHeading,
      userPosition,
      captureTrackingBearing,
    ],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
