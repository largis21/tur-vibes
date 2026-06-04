import { useState } from "react";
import { usePointInfo } from "../lib/PointInfoContext";
import { usePoi } from "../tools/poi/context";
import { ModalShell } from "./ModalShell";
import { PiMapPin } from "react-icons/pi";

function formatCoord(value: number) {
  return value.toFixed(5);
}

function compassFromBearing(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8]!;
}

export function PointInfoModal() {
  const { point, info, placeName, loading, error, close } = usePointInfo();
  const { addPoi } = usePoi();
  const [saving, setSaving] = useState(false);

  if (!point) return null;

  async function handleSaveAsPoi() {
    if (!point) return;
    setSaving(true);
    await addPoi({
      lat: point.latitude,
      lng: point.longitude,
      color: "#3b82f6",
      locationType: null,
      elevation: info?.elevation ?? null,
    });
    setSaving(false);
    // addPoi already calls setSelectedPoiId so CustomPoiCard opens automatically
    close();
  }

  return (
    <ModalShell title="Point info" subtitle={placeName} onClose={close}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Stat
          label="Coordinates"
          value={`${formatCoord(point.latitude)}, ${formatCoord(point.longitude)}`}
        />
        <Stat
          label="Elevation"
          value={
            loading
              ? "…"
              : info?.elevation != null
                ? `${info.elevation.toFixed(0)} m`
                : "–"
          }
        />
        <Stat
          label="Slope"
          value={
            loading
              ? "…"
              : info?.slopeDeg != null
                ? `${info.slopeDeg.toFixed(1)}°`
                : "–"
          }
        />
        <Stat
          label="Aspect"
          value={
            loading
              ? "…"
              : info?.aspectDeg != null
                ? `${compassFromBearing(info.aspectDeg)} (${Math.round(info.aspectDeg)}°)`
                : "–"
          }
        />
      </div>

      {error ? (
        <div
          style={{
            fontSize: 12,
            color: "#fca5a5",
            background: "rgba(220, 38, 38, 0.15)",
            borderRadius: 8,
            padding: "6px 8px",
          }}
        >
          {error} — elevation requires an internet connection.
        </div>
      ) : null}

      <button
        onClick={handleSaveAsPoi}
        disabled={saving}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "11px 14px",
          borderRadius: 12,
          background: "rgba(59,130,246,0.15)",
          border: "1px solid rgba(59,130,246,0.4)",
          color: "#60a5fa",
          fontSize: 14,
          fontWeight: 600,
          cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.6 : 1,
        }}
      >
        <PiMapPin
          size={16}
          color="#60a5fa"
          style={{ display: "block", flexShrink: 0 }}
        />
        {saving ? "Saving…" : "Save as POI"}
      </button>
    </ModalShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          color: "#9ca3af",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 16,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
