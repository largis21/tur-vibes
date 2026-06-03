import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { Region } from "./types";

export const BLANK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#000000" },
    },
  ],
};

export function regionFromMap(map: MapLibreMap): Region {
  const bounds = map.getBounds();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();
  return {
    latitude: (north + south) / 2,
    longitude: (east + west) / 2,
    latitudeDelta: north - south,
    longitudeDelta: east - west,
  };
}

export function zoomFromLongitudeDelta(longitudeDelta: number): number {
  return Math.log2(360 / longitudeDelta);
}
