import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { useEffect, useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { MapMouseEvent } from "maplibre-gl";
import { destinationPoint } from "../../lib/geoBearing";
import { useMap } from "../../lib/MapContext";
import { useBearing } from "./context";

/** Long enough to span the visible map at any reasonable zoom. */
const PROJECTION_DISTANCE_METERS = 500_000;

export function BearingMapChildren() {
  const { mapRef } = useMap();
  const { bearings, selectedBearingId, selectBearing } = useBearing();

  // Deselect bearing when the user clicks on the map outside a compass widget.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    function handleMapClick(e: MapMouseEvent) {
      const features = map!.queryRenderedFeatures(e.point, {
        layers: ["bearing-points-fill"],
      });
      if (features.length === 0) {
        selectBearing(null);
      }
    }
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [mapRef, selectBearing]);

  const lines = useMemo<FeatureCollection<LineString>>(() => {
    const features: Feature<LineString>[] = bearings.map((b) => {
      const end = destinationPoint(
        b.point,
        PROJECTION_DISTANCE_METERS,
        b.heading,
      );
      return {
        type: "Feature",
        properties: { id: b.id, selected: b.id === selectedBearingId },
        geometry: {
          type: "LineString",
          coordinates: [
            [b.point.longitude, b.point.latitude],
            [end.longitude, end.latitude],
          ],
        },
      };
    });
    return { type: "FeatureCollection", features };
  }, [bearings, selectedBearingId]);

  const points = useMemo<FeatureCollection<Point>>(() => {
    const features: Feature<Point>[] = bearings.map((b) => ({
      type: "Feature",
      properties: { id: b.id, selected: b.id === selectedBearingId },
      geometry: {
        type: "Point",
        coordinates: [b.point.longitude, b.point.latitude],
      },
    }));
    return { type: "FeatureCollection", features };
  }, [bearings, selectedBearingId]);

  if (bearings.length === 0) return null;

  return (
    <>
      <Source id="bearing-lines" type="geojson" data={lines}>
        <Layer
          id="bearing-lines-layer"
          type="line"
          paint={{
            "line-color": ["case", ["get", "selected"], "#f97316", "#fb923c"],
            "line-width": ["case", ["get", "selected"], 3, 2],
            "line-opacity": 0.9,
          }}
          layout={{ "line-cap": "round", "line-join": "round" }}
        />
      </Source>
      <Source id="bearing-points" type="geojson" data={points}>
        <Layer
          id="bearing-points-outline"
          type="circle"
          paint={{
            "circle-radius": 7,
            "circle-color": "#ffffff",
          }}
        />
        <Layer
          id="bearing-points-fill"
          type="circle"
          paint={{
            "circle-radius": 4,
            "circle-color": ["case", ["get", "selected"], "#dc2626", "#f97316"],
          }}
        />
      </Source>
    </>
  );
}
