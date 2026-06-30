import { useMemo } from "react";
import { formatDistance, getTotalDistanceMeters } from "../../lib/geo";
import { useActiveTool } from "../../lib/ActiveToolContext";
import { PiBackspace, PiPlus } from "react-icons/pi";
import { ToolHeader } from "../../components/ui/ToolHeader";
import { useMeasure, type ElevationSample } from "./context";

export function MeasureOverlay() {
  const { deactivateTool } = useActiveTool();
  const { points, addPoint, removeLastPoint, clear, elevationProfile, elevationLoading } = useMeasure();

  const distanceMeters = useMemo(
    () => getTotalDistanceMeters(points),
    [points],
  );

  function handleClose() {
    clear();
    deactivateTool();
  }

  const showProfile = points.length >= 2;

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

      {showProfile && (
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 84,
            left: 12,
            background: "rgba(20,20,20,0.82)",
            borderRadius: 12,
            padding: "8px 10px 6px",
            backdropFilter: "blur(8px)",
            zIndex: 20,
          }}
        >
          {elevationLoading ? (
            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 11,
                textAlign: "center",
                padding: "10px 0",
              }}
            >
              Loading elevation…
            </div>
          ) : elevationProfile ? (
            <ElevationProfile profile={elevationProfile} />
          ) : null}
        </div>
      )}

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

function ElevationProfile({ profile }: { profile: ElevationSample[] }) {
  const validElevations = profile
    .map((s) => s.elevation)
    .filter((e): e is number => e !== null);
  if (validElevations.length < 2) return null;

  const minElev = Math.min(...validElevations);
  const maxElev = Math.max(...validElevations);
  const elevRange = maxElev - minElev || 1;
  const totalDist = profile[profile.length - 1].distanceMeters;

  // Compute gain and loss
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1].elevation;
    const b = profile[i].elevation;
    if (a !== null && b !== null) {
      const diff = b - a;
      if (diff > 0) gain += diff;
      else loss += -diff;
    }
  }

  // SVG coordinate space
  const W = 300;
  const H = 58;
  const PAD_T = 4;
  const PAD_B = 14;
  const PAD_L = 30;
  const PAD_R = 4;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const toX = (dist: number) => PAD_L + (dist / totalDist) * plotW;
  const toY = (elev: number) =>
    PAD_T + plotH - ((elev - minElev) / elevRange) * plotH;

  // Build path segments (break on null values)
  type Segment = string[];
  const segments: Segment[] = [];
  let current: Segment = [];
  for (const s of profile) {
    if (s.elevation === null) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    } else {
      current.push(`${toX(s.distanceMeters).toFixed(1)},${toY(s.elevation).toFixed(1)}`);
    }
  }
  if (current.length > 0) segments.push(current);

  // Build filled area path
  const areaPath = segments
    .filter((seg) => seg.length >= 2)
    .map((seg) => {
      const firstX = seg[0].split(",")[0];
      const lastX = seg[seg.length - 1].split(",")[0];
      const bottom = (PAD_T + plotH).toFixed(1);
      return `M ${firstX},${bottom} ${seg.map((p) => `L ${p}`).join(" ")} L ${lastX},${bottom} Z`;
    })
    .join(" ");

  const formatElev = (e: number) => `${Math.round(e)}m`;
  const formatGainLoss = (v: number) => `${Math.round(v)}m`;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          fontSize: 10,
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <span>
          ↑ {formatGainLoss(gain)} ↓ {formatGainLoss(loss)}
        </span>
        <span>
          {formatElev(minElev)} – {formatElev(maxElev)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block", overflow: "visible" }}
        aria-label="Elevation profile"
      >
        <defs>
          <linearGradient id="elev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line
          x1={PAD_L}
          y1={PAD_T + plotH}
          x2={W - PAD_R}
          y2={PAD_T + plotH}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#elev-fill)" />}

        {/* Profile lines */}
        {segments.map((seg, i) => (
          <polyline
            key={i}
            points={seg.join(" ")}
            fill="none"
            stroke="#f97316"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ))}

        {/* Y-axis labels */}
        <text
          x={PAD_L - 2}
          y={PAD_T + 6}
          fill="rgba(255,255,255,0.5)"
          fontSize="8"
          textAnchor="end"
        >
          {formatElev(maxElev)}
        </text>
        <text
          x={PAD_L - 2}
          y={PAD_T + plotH}
          fill="rgba(255,255,255,0.5)"
          fontSize="8"
          textAnchor="end"
        >
          {formatElev(minElev)}
        </text>

        {/* X-axis distance labels */}
        <text
          x={PAD_L}
          y={H - 2}
          fill="rgba(255,255,255,0.4)"
          fontSize="8"
          textAnchor="start"
        >
          0
        </text>
        <text
          x={W - PAD_R}
          y={H - 2}
          fill="rgba(255,255,255,0.4)"
          fontSize="8"
          textAnchor="end"
        >
          {totalDist < 1000
            ? `${Math.round(totalDist)}m`
            : `${(totalDist / 1000).toFixed(2)}km`}
        </text>
      </svg>
    </div>
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
