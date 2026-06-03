import { usePointInfo } from "../lib/PointInfoContext";
import { Icon } from "./Icon";

function formatCoord(value: number) {
  return value.toFixed(5);
}

function compassFromBearing(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8]!;
}

export function PointInfoModal() {
  const { point, info, loading, error, close } = usePointInfo();

  if (!point) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        padding: 16,
        zIndex: 90,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(17, 24, 39, 0.96)",
          color: "#fff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "#9ca3af",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Point info
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 14,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {formatCoord(point.latitude)}, {formatCoord(point.longitude)}
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={close}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={18} color="#fff" />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
      </div>
    </div>
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
