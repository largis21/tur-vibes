import { useEffect, useMemo, useRef, useState } from "react";
import { useMap, useMapRegion } from "../lib/MapContext";
import type { LatLng } from "../lib/types";
import { GotoModal } from "./GotoModal";
import { useGeoLocation } from "../state/geoLocation/useGeoLocation";
import { bearingBetween } from "../lib/geoBearing";
import { getDistanceMeters, formatDistance } from "../lib/geo";
import { fetchPointInfo, type PointInfo } from "../lib/elevation";

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

  const [pointInfo, setPointInfo] = useState<PointInfo | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetchPointInfo(cursor, 30, controller.signal)
        .then((info) => setPointInfo(info))
        .catch(() => {});
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cursor]);

  const bearingInfo = useMemo(() => {
    if (!userPosition) return null;
    const bearing = bearingBetween(userPosition, cursor);
    const dist = getDistanceMeters(userPosition, cursor);
    const cardinals = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const cardinal = cardinals[Math.round(bearing / 45) % 8];
    return `${Math.round(bearing)}°${cardinal}, ${formatDistance(dist).replace(' ', '')}`;
  }, [userPosition, cursor]);

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
        className="absolute left-3 bottom-5 bg-dark-900/75 rounded-lg px-2 py-1.5 flex flex-col items-start gap-0 z-20 text-left cursor-pointer hover:bg-dark-900 transition-colors"
      >
        <Row
          label={copiedLabel === "Cursor" ? "✓ Copied" : "Cursor"}
          value={formatCoord(cursor)}
          onCopy={() => handleCopyCoords("Cursor")}
          copied={copiedLabel === "Cursor"}
        />
        {bearingInfo && (
          <span className="text-white font-mono text-[10px] font-medium leading-normal">
            {bearingInfo}
          </span>
        )}
        {pointInfo && (
          <span className="text-white font-mono text-[10px] font-medium leading-normal">
            {pointInfo.elevation !== null ? `${Math.round(pointInfo.elevation)}m` : ""}
            {pointInfo.elevation !== null && pointInfo.slopeDeg !== null ? ", " : ""}
            {pointInfo.slopeDeg !== null ? `${Math.round(pointInfo.slopeDeg)}°` : ""}
          </span>
        )}
        <Row
          label={copiedLabel === "You" ? "✓ Copied" : "You"}
          value={formatCoord(userPosition)}
          onCopy={() => handleCopyCoords("You")}
          copied={copiedLabel === "You"}
        />
        {userPosition?.altitude != null && (
          <span className="text-white font-mono text-[10px] font-medium leading-normal">
            {`${Math.round(userPosition.altitude)}m GPS`}
          </span>
        )}
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

function Row({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-[9px] font-semibold uppercase tracking-wider">
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
        className={`text-white font-mono text-[10px] font-medium leading-normal text-left cursor-pointer transition-colors ${
          copied ? "text-green-400" : "hover:text-blue-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
