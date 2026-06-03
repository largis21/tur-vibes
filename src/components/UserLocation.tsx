import type { Feature, Point } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { usePermissions } from "../lib/permissions";

type Position = {
  longitude: number;
  latitude: number;
  accuracy: number;
};

export function UserLocation() {
  const { location } = usePermissions();
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (location !== "granted") {
      setPosition(null);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        setPosition({
          longitude: p.coords.longitude,
          latitude: p.coords.latitude,
          accuracy: p.coords.accuracy,
        });
      },
      () => {
        // Ignore errors (permission revoked at the OS level, etc.).
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [location]);

  const point = useMemo<Feature<Point> | null>(() => {
    if (!position) return null;
    return {
      type: "Feature",
      properties: { accuracy: position.accuracy },
      geometry: {
        type: "Point",
        coordinates: [position.longitude, position.latitude],
      },
    };
  }, [position]);

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
