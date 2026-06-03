import { useMemo } from "react";
import { formatDistance, getTotalDistanceMeters } from "../../lib/geo";
import { useMap } from "../../lib/MapContext";
import { Icon } from "../../components/Icon";
import { useMeasure } from "./context";

export function MeasureOverlay() {
  const { deactivateTool } = useMap();
  const { points, addPoint, removeLastPoint, clear } = useMeasure();

  const distanceMeters = useMemo(
    () => getTotalDistanceMeters(points),
    [points],
  );

  function handleClose() {
    clear();
    deactivateTool();
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          background: "rgba(17, 24, 39, 0.9)",
          borderRadius: 16,
          display: "flex",
          gap: 12,
          padding: "12px 16px",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <button
          aria-label="Remove last point"
          disabled={points.length === 0}
          onClick={removeLastPoint}
          style={{
            ...actionButton,
            opacity: points.length === 0 ? 0.35 : 1,
          }}
        >
          <Icon name="backspace" size={20} color="#fff" />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            Measure
          </div>
          <div
            style={{
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            {points.length === 0
              ? "Pan the map, then add a point"
              : `${points.length} point${
                  points.length === 1 ? "" : "s"
                } - ${formatDistance(distanceMeters)}`}
          </div>
        </div>
        <button aria-label="Close" onClick={handleClose} style={actionButton}>
          <Icon name="close" size={20} color="#fff" />
        </button>
      </div>
      <button
        aria-label="Add point"
        onClick={addPoint}
        style={{
          position: "absolute",
          right: 20,
          bottom: 36,
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "#f97316",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
          zIndex: 20,
        }}
      >
        <Icon name="add" size={32} color="#fff" />
      </button>
    </>
  );
}

const actionButton: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 10,
  background: "rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
