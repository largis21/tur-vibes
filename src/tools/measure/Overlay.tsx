import { useMemo } from "react";
import { formatDistance, getTotalDistanceMeters } from "../../lib/geo";
import { useActiveTool } from "../../lib/ActiveToolContext";
import { PiBackspace, PiPlus } from "react-icons/pi";
import { ToolHeader } from "../../components/ui/ToolHeader";
import { useMeasure } from "./context";

export function MeasureOverlay() {
  const { deactivateTool } = useActiveTool();
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
      <ToolHeader
        title="Measure"
        subtitle={
          points.length === 0
            ? "Pan the map, then add a point"
            : `${points.length} point${
                points.length === 1 ? "" : "s"
              } - ${formatDistance(distanceMeters)}`
        }
        buttons={[
          <button
            key="remove"
            aria-label="Remove last point"
            disabled={points.length === 0}
            onClick={removeLastPoint}
            style={{
              ...actionButton,
              opacity: points.length === 0 ? 0.35 : 1,
            }}
          >
            <PiBackspace
              size={20}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>,
        ]}
        onClose={handleClose}
        ariaLabel="Measure tool"
      />
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
        <PiPlus
          size={32}
          color="#fff"
          style={{ display: "block", flexShrink: 0 }}
        />
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
