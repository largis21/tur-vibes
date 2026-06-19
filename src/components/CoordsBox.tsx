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
  const [gotoOpen, setGotoOpen] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<"Cursor" | "You" | null>(null);

  // Derive just the lat/lon from the map's Region — re-renders only when
  // those numbers change.
  const cursor = useMapRegion<LatLng>(
    (region) => {
      if (!region) return cursorCoordinate.current;
      return { latitude: region.latitude, longitude: region.longitude };
    },
    (a, b) => a.latitude === b.latitude && a.longitude === b.longitude,
  );

  function handleCopyCoords(label: "Cursor" | "You") {
    const coord = label === "Cursor" ? cursor : userPosition;
    if (!coord) return;
    const coordsText = `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`;
    navigator.clipboard.writeText(coordsText).then(() => {
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 2000);
    });
  }

  return (
    <>
      <div
        onClick={() => setGotoOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setGotoOpen(true);
          }
        }}
        aria-label="Go to coordinate"
        className="absolute left-4 bottom-9 bg-dark-900/75 rounded-lg px-3 py-2 flex flex-col items-start gap-1 z-20 text-left cursor-pointer hover:bg-dark-900 transition-colors"
      >
        <Row 
          label={copiedLabel === "Cursor" ? "✓ Copied" : "Cursor"} 
          value={formatCoord(cursor)}
          onCopy={() => handleCopyCoords("Cursor")}
          copied={copiedLabel === "Cursor"}
        />
        <Row 
          label={copiedLabel === "You" ? "✓ Copied" : "You"}
          value={formatCoord(userPosition)}
          onCopy={() => handleCopyCoords("You")}
          copied={copiedLabel === "You"}
        />
      </div>
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

function Row({ label, value, onCopy, copied }: { label: string; value: string; onCopy?: () => void; copied?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onCopy?.();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onCopy?.();
          }
        }}
        title="Click to copy"
        className={`text-white font-mono text-xs font-medium leading-normal text-left cursor-pointer transition-colors ${
          copied ? "text-green-400" : "hover:text-blue-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
