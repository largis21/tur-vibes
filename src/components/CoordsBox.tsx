import { useEffect, useState } from "react";
import { useMap } from "../lib/MapContext";
import { usePermissions } from "../lib/permissions";
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
  const [gotoOpen, setGotoOpen] = useState(false);

  useEffect(() => {
    return subscribeRegionChange((region) => {
      setCursor({ latitude: region.latitude, longitude: region.longitude });
    });
  }, [subscribeRegionChange]);

  useEffect(() => {
    if (location !== "granted") {
      setUser(null);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUser({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
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
          background: "rgba(17, 24, 39, 0.85)",
          borderRadius: 12,
          padding: "10px 12px",
          gap: 4,
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
        <Row label="You" value={formatCoord(user)} />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          color: "#9ca3af",
          fontSize: 10,
          fontWeight: 700,
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
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}
