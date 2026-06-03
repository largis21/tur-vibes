import type { FeatureCollection, LineString } from "geojson";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { polygonBBox, polygonOverlapsBounds } from "../lib/offlineTiles";
import type { SavedOfflineRegion } from "../lib/savedRegions";
import type { LatLng } from "../lib/types";

type FeatureProps = { color: string; width: number };

export function SavedRegionsOverlay({
  regions,
  selectionPolygon,
}: {
  regions: SavedOfflineRegion[];
  selectionPolygon?: LatLng[] | null;
}) {
  const fc = useMemo<FeatureCollection<LineString, FeatureProps>>(() => {
    return {
      type: "FeatureCollection",
      features: regions.map((region) => {
        const ring = region.polygon.map(
          (p) => [p.longitude, p.latitude] as [number, number],
        );
        if (ring.length > 0) ring.push(ring[0]!);
        const highlighted =
          !!selectionPolygon &&
          selectionPolygon.length >= 3 &&
          polygonOverlapsBounds(selectionPolygon, polygonBBox(region.polygon));
        return {
          type: "Feature",
          id: region.id,
          properties: {
            color: highlighted ? "#eab308" : "#22c55e",
            width: highlighted ? 2 : 1,
          },
          geometry: {
            type: "LineString",
            coordinates: ring,
          },
        };
      }),
    };
  }, [regions, selectionPolygon]);

  if (regions.length === 0) return null;

  return (
    <Source id="saved-regions-src" type="geojson" data={fc}>
      <Layer
        id="saved-regions-line"
        type="line"
        paint={{
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
          "line-dasharray": [4, 4],
        }}
      />
    </Source>
  );
}
