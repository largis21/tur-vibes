import { createContext, useContext, type MutableRefObject } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { LatLng, Region } from "./types";

export type RegionChangeListener = (region: Region) => void;

export type MapContextValue = {
  mapRef: MutableRefObject<MapLibreMap | null>;
  cursorCoordinate: MutableRefObject<LatLng>;
  regionListeners: MutableRefObject<Set<RegionChangeListener>>;
  subscribeRegionChange: (listener: RegionChangeListener) => () => void;
  deactivateTool: () => void;
};

const MapContext = createContext<MapContextValue | null>(null);

export const MapContextProvider = MapContext.Provider;

export function useMap(): MapContextValue {
  const value = useContext(MapContext);
  if (!value) {
    throw new Error("useMap must be used within a MapContextProvider");
  }
  return value;
}
