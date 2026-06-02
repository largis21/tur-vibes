import { createContext, useContext, type RefObject } from "react";
import type MapView from "react-native-maps";
import type { LatLng, Region } from "react-native-maps";

export type RegionChangeListener = (region: Region) => void;

export type MapContextValue = {
  mapRef: RefObject<MapView | null>;
  cursorCoordinate: RefObject<LatLng>;
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
