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
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUser(userLocation);
        setGpsAltitude(position.coords.altitude);
        setAccuracy(position.coords.accuracy);
        fetchElevations([userLocation]).then((elevations) => {
          setUserElevation(elevations[0] ?? null);
        });
      },
      undefined,
      { enableHighAccuracy: false, maximumAge: 5000 },
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [location]);

  return (
    <>
      <button
        type="button"
        onClick={() => setGotoOpen(true)}
        aria-label="Go to coordinate"
        style={{
          position: "absolute",
          left: 16,
          bottom: 36,
          background: "rgba(17, 24, 39, 0.5)",
          borderRadius: 8,
          padding: "6px 10px",
          gap: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "left",
          zIndex: 10,
          border: "none",
          color: "inherit",
        }}
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
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          color: "#9ca3af",
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
      {gpsAltitude !== null && gpsAltitude !== undefined && (
        <span
          style={{
            color: "#fff",
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: 400,
            marginTop: 1,
          }}
        >
          GPS: {Math.round(gpsAltitude)} m
          {accuracy !== null &&
            accuracy !== undefined &&
            ` (±${Math.round(accuracy)}m)`}
        </span>
      )}
      {elevation !== null && elevation !== undefined && (
        <span
          style={{
            color: "#fff",
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: 400,
            marginTop: 1,
          }}
        >
          Terrain: {Math.round(elevation)} m
        </span>
      )}
    </div>
  );
}
