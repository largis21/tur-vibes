import { useEffect, useState } from "react";
import { useMap } from "../lib/MapContext";
import { usePermissions } from "../lib/permissions";
import { fetchElevations } from "../lib/elevation";
import type { LatLng } from "../lib/types";
import { GotoModal } from "./GotoModal";

function formatCoord(coord: LatLng | null) {
  if (!coord) return "—";
  return `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`;
}

export function CoordsBox() {
  const { cursorCoordinate, subscribeRegionChange, mapRef } = useMap();
  const { location } = usePermissions();
  const [cursor, setCursor] = useState<LatLng>(cursorCoordinate.current);
  const [user, setUser] = useState<LatLng | null>(null);
  const [userElevation, setUserElevation] = useState<number | null>(null);
  const [gpsAltitude, setGpsAltitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gotoOpen, setGotoOpen] = useState(false);

  useEffect(() => {
    return subscribeRegionChange((region) => {
      setCursor({ latitude: region.latitude, longitude: region.longitude });
    });
  }, [subscribeRegionChange]);

  useEffect(() => {
    if (location !== "granted") {
      setUser(null);
      setUserElevation(null);
      setGpsAltitude(null);
      setAccuracy(null);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let elevationTimeoutId: number | null = null;
    let elevationCtrl: AbortController | null = null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUser(userLocation);
        setGpsAltitude(position.coords.altitude);
        setAccuracy(position.coords.accuracy);

        // Debounce elevation fetches to avoid spamming the API
        if (elevationTimeoutId !== null) clearTimeout(elevationTimeoutId);
        if (elevationCtrl) elevationCtrl.abort();

        elevationCtrl = new AbortController();
        elevationTimeoutId = window.setTimeout(() => {
          fetchElevations([userLocation], elevationCtrl!.signal)
            .then((elevations) => {
              if (!elevationCtrl!.signal.aborted) {
                setUserElevation(elevations[0] ?? null);
              }
            })
            .catch(() => {
              /* ignore cancellations and errors */
            });
          elevationTimeoutId = null;
        }, 2000); // Only fetch elevation every 2 seconds max
      },
      undefined,
      { enableHighAccuracy: false, maximumAge: 5000 },
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (elevationTimeoutId !== null) clearTimeout(elevationTimeoutId);
      if (elevationCtrl) elevationCtrl.abort();
    };
  }, [location]);

  return (
    <>
      <button
        type="button"
        onClick={() => setGotoOpen(true)}
        aria-label="Go to coordinate"
        className="absolute left-4 bottom-9 bg-dark-900/75 rounded-lg px-3 py-2 flex flex-col items-start gap-1 z-20 text-left"
      >
        <Row label="Cursor" value={formatCoord(cursor)} />
        <Row
          label="You"
          value={formatCoord(user)}
          elevation={userElevation}
          gpsAltitude={gpsAltitude}
          accuracy={accuracy}
        />
      </button>
      {gotoOpen ? (
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
      ) : null}
    </>
  );
}

function Row({
  label,
  value,
  elevation,
  gpsAltitude,
  accuracy,
}: {
  label: string;
  value: string;
  elevation?: number | null;
  gpsAltitude?: number | null;
  accuracy?: number | null;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-white font-mono text-xs font-medium">{value}</span>
      {gpsAltitude !== null && gpsAltitude !== undefined && (
        <span className="text-white font-mono text-xs font-normal mt-0.5">
          GPS: {Math.round(gpsAltitude)} m
          {accuracy !== null &&
            accuracy !== undefined &&
            ` (±${Math.round(accuracy)}m)`}
        </span>
      )}
      {elevation !== null && elevation !== undefined && (
        <span className="text-white font-mono text-xs font-normal mt-0.5">
          Terrain: {Math.round(elevation)} m
        </span>
      )}
    </div>
  );
}
