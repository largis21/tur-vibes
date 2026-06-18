import { useState } from "react";
import { useMap, useMapRegion } from "../lib/MapContext";
import type { LatLng } from "../lib/types";
import { GotoModal } from "./GotoModal";
import { useGeoLocation } from "../state/geoLocation/useGeoLocation";

function formatCoord(coord: (LatLng & { accuracy?: number }) | null) {
  if (!coord) return "—";
  return `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}${coord.accuracy ? ` (±${Math.round(coord.accuracy)}m)` : ""}`;
}

export function CoordsBox() {
  const { cursorCoordinate, mapRef } = useMap();
  const userPosition = useGeoLocation((state) => state.userPosition);

  // Derive just the lat/lon from the map's Region — re-renders only when
  // those numbers change.
  const cursor = useMapRegion<LatLng>(
    (region) => {
      if (!region) return cursorCoordinate.current;
      return { latitude: region.latitude, longitude: region.longitude };
    },
    (a, b) => a.latitude === b.latitude && a.longitude === b.longitude,
  );
  const [gotoOpen, setGotoOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setGotoOpen(true)}
        aria-label="Go to coordinate"
        className="absolute left-4 bottom-9 bg-dark-900/75 rounded-lg px-3 py-2 flex flex-col items-start gap-1 z-20 text-left"
      >
        <Row label="Cursor" value={formatCoord(cursor)} />
        <Row label="You" value={formatCoord(userPosition)} />
      </button>
      {gotoOpen && (
        <GotoModal
          initial={cursor}
          onClose={() => setGotoOpen(false)}
          onSubmit={(coord) => {
            mapRef.current?.flyTo({
              center: [coord.longitude, coord.latitude],
              duration: 600,
            });
            setGotoOpen(false);
          }}
        />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-white font-mono text-xs font-medium leading-normal">
        {value}
      </span>
    </div>
  );
}
