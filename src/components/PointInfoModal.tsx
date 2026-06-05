import { useState } from "react";
import { usePointInfo } from "../lib/PointInfoContext";
import { usePoi } from "../tools/poi/context";
import { ModalShell } from "./ModalShell";
import { TerrainViewModalContent } from "./TerrainViewModal";
import { PiMapPin, PiMountains, PiArrowLeft } from "react-icons/pi";

function formatCoord(value: number) {
  return value.toFixed(5);
}

function compassFromBearing(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8]!;
}

export function PointInfoModal() {
  const {
    point,
    info,
    placeName,
    loading,
    error,
    close,
    toggleAspectArrow,
    showAspectArrow,
  } = usePointInfo();
  const { addPoi } = usePoi();
  const [saving, setSaving] = useState(false);
  const [showTerrainView, setShowTerrainView] = useState(false);

  if (!point) return null;

  function handleClose() {
    setShowTerrainView(false);
    close();
  }

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
    <ModalShell
      title={showTerrainView ? "Terrain View" : "Point info"}
      subtitle={showTerrainView ? `${point.latitude.toFixed(4)}°N, ${point.longitude.toFixed(4)}°E` : placeName}
      onClose={handleClose}
    >
      {showTerrainView ? (
        <>
          <TerrainViewModalContent point={point} />
          <button
            onClick={() => setShowTerrainView(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              marginTop: "12px",
              padding: "11px 14px",
              borderRadius: 12,
              background: "rgba(107,114,128,0.15)",
              border: "1px solid rgba(107,114,128,0.4)",
              color: "#d1d5db",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <PiArrowLeft size={16} style={{ display: "block", flexShrink: 0 }} />
            Back
          </button>
        </>
      ) : (
        <>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
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
            onClick={toggleAspectArrow}
            isClickable={info?.aspectDeg != null && !loading}
            isActive={showAspectArrow}
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

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={() => setShowTerrainView(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flex: 1,
              padding: "11px 14px",
              borderRadius: 12,
              background: "rgba(168,85,247,0.15)",
              border: "1px solid rgba(168,85,247,0.4)",
              color: "#d8b4fe",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <PiMountains
              size={16}
              style={{ display: "block", flexShrink: 0 }}
            />
            View from here
          </button>

          <button
            onClick={handleSaveAsPoi}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flex: 1,
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
          </div>
        </>
      )}
    </ModalShell>
  );
}

function Stat({
  label,
  value,
  onClick,
  isClickable,
  isActive,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  isClickable?: boolean;
  isActive?: boolean;
}) {
  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        cursor: isClickable ? "pointer" : "default",
        padding: isClickable ? "8px 10px" : "0",
        borderRadius: isClickable ? "8px" : "0",
        backgroundColor: isActive
          ? "rgba(59,130,246,0.25)"
          : isClickable
            ? "rgba(59,130,246,0.08)"
            : "transparent",
        transition: isClickable ? "all 0.15s" : "none",
      }}
      onMouseEnter={(e) => {
        if (isClickable && !isActive) {
          e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable && !isActive) {
          e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.08)";
        }
      }}
    >
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
