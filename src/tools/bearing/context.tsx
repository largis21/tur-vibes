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
  const raw = safeGetJSON<unknown>(STORAGE_KEYS.bearings, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isBearing);
}

function saveBearings(bearings: Bearing[]) {
  safeSetJSON(STORAGE_KEYS.bearings, bearings);
}

export type Bearing = {
  id: string;
  point: LatLng;
  /** Heading in degrees, 0 = true north, clockwise. */
  heading: number;
};

type BearingContextValue = {
  bearings: Bearing[];
  selectedBearingId: string | null;
  selectBearing: (id: string | null) => void;
  addBearing: () => void;
  removeBearing: (id: string) => void;
  setBearingHeading: (id: string, heading: number) => void;
  clearBearings: () => void;
};

const BearingContext = createContext<BearingContextValue | null>(null);

export function useBearing(): BearingContextValue {
  const value = useContext(BearingContext);
  if (!value) {
    throw new Error("useBearing must be used within BearingProvider");
  }
  return value;
}

function makeId() {
  return `b-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function BearingProvider({ children }: { children: ReactNode }) {
  const { cursorCoordinate } = useMap();
  const [bearings, setBearings] = useState<Bearing[]>(() => loadBearings());
  const [selectedBearingId, setSelectedBearingId] = useState<string | null>(
    null,
  );

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

  const value = useMemo<BearingContextValue>(
    () => ({
      bearings,
      selectedBearingId,
      selectBearing: setSelectedBearingId,
      addBearing,
      removeBearing,
      setBearingHeading,
      clearBearings,
    }),
    [
      bearings,
      selectedBearingId,
      addBearing,
      removeBearing,
      setBearingHeading,
      clearBearings,
    ],
  );

  return (
    <BearingContext.Provider value={value}>{children}</BearingContext.Provider>
  );
}
