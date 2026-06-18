import type { Feature, Point } from "geojson";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useGeoLocation } from "../state/geoLocation/useGeoLocation";

export function UserLocation() {
  const userLocation = useGeoLocation((state) => state.userPosition);

  const point = useMemo<Feature<Point> | null>(() => {
    if (!userLocation) return null;
    return {
      type: "Feature",
      properties: { accuracy: userLocation.accuracy },
      geometry: {
        type: "Point",
        coordinates: [userLocation.longitude, userLocation.latitude],
      },
    };
  }, [userLocation]);

  if (!point) return null;

  return (
    <Source id="user-location" type="geojson" data={point}>
      {/* Accuracy halo. Radius is in pixels, so it does not strictly match the
          accuracy in meters, but gives a visual hint at high zoom. */}
      <Layer
        id="user-location-accuracy"
        type="circle"
        paint={{
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            8,
            16,
            ["min", ["/", ["get", "accuracy"], 2], 60],
          ],
          "circle-color": "#1d4ed8",
          "circle-opacity": 0.15,
          "circle-stroke-color": "#1d4ed8",
          "circle-stroke-opacity": 0.35,
          "circle-stroke-width": 1,
        }}
      />
      <Layer
        id="user-location-dot-outline"
        type="circle"
        paint={{
          "circle-radius": 9,
          "circle-color": "#ffffff",
        }}
      />
      <Layer
        id="user-location-dot"
        type="circle"
        paint={{
          "circle-radius": 6,
          "circle-color": "#1d4ed8",
        }}
      />
    </Source>
  );
}
