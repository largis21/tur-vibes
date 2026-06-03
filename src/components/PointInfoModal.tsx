import { usePointInfo } from "../lib/PointInfoContext";
import { ModalShell } from "./ModalShell";

function formatCoord(value: number) {
  return value.toFixed(5);
}

function compassFromBearing(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8]!;
}

export function PointInfoModal() {
  const { point, info, placeName, loading, error, close } = usePointInfo();

  if (!point) return null;

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
