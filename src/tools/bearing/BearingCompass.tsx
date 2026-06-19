import { useEffect, useRef } from "react";
import { useMap } from "../../lib/MapContext";
import type { Bearing } from "./context";

const RADIUS = 44;
const STROKE = 12;
const SIZE = (RADIUS + STROKE) * 2;

/**
 * A circular compass overlay rendered on top of the map at a bearing point.
 * The user drags around the ring to rotate the heading.
 */
export function BearingCompass({
  bearing,
  selected,
  onSelect,
  onChangeHeading,
}: {
  bearing: Bearing;
  selected: boolean;
  onSelect: () => void;
  onChangeHeading: (heading: number) => void;
}) {
  const { mapRef } = useMap();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dialRef = useRef<SVGGElement | null>(null);
  const ringRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef(false);
  // Latest map bearing, kept in a ref so the pointer math in `angleFromPointer`
  // can read it synchronously without re-rendering.
  const mapBearingRef = useRef(0);

  // Continuously sync the compass's screen position and rotation with the map.
  // We bypass React state to avoid lag; transforms are applied directly to the
  // DOM/SVG nodes on every map render frame.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = () => {
      const container = containerRef.current;
      const dial = dialRef.current;
      if (!container) return;
      const projected = map.project([
        bearing.point.longitude,
        bearing.point.latitude,
      ]);
      // Use translate3d to keep this on the GPU-composited layer.
      container.style.transform = `translate3d(${projected.x - SIZE / 2}px, ${
        projected.y - SIZE / 2
      }px, 0)`;
      const b = map.getBearing();
      mapBearingRef.current = b;
      if (dial)
        dial.setAttribute("transform", `rotate(${-b} ${SIZE / 2} ${SIZE / 2})`);
      // Reveal once the position has been computed at least once.
      if (container.style.opacity !== "1") container.style.opacity = "1";
    };

    sync();
    map.on("move", sync);
    map.on("rotate", sync);
    map.on("zoom", sync);
    map.on("render", sync);
    return () => {
      map.off("move", sync);
      map.off("rotate", sync);
      map.off("zoom", sync);
      map.off("render", sync);
    };
  }, [bearing.point.latitude, bearing.point.longitude, mapRef, selected]);

  function angleFromPointer(clientX: number, clientY: number): number {
    const svg = ringRef.current;
    if (!svg) return bearing.heading;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // Compass: 0 = up (screen-up), increasing clockwise.
    const screenDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    // Convert from screen-relative angle to true heading by adding the
    // current map bearing (north on screen sits at -mapBearing from up).
    return (((screenDeg + mapBearingRef.current) % 360) + 360) % 360;
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    if (!selected) {
      onSelect();
      return;
    }
    draggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    onChangeHeading(angleFromPointer(e.clientX, e.clientY));
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    e.stopPropagation();
    onChangeHeading(angleFromPointer(e.clientX, e.clientY));
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    e.stopPropagation();
    draggingRef.current = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore — pointer might already be released
    }
  }

  if (!selected) {
    return (
      <button
        ref={(el) => {
          containerRef.current = el as unknown as HTMLDivElement | null;
        }}
        type="button"
        aria-label="Select bearing"
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SIZE,
          height: SIZE,
          background: "transparent",
          border: "none",
          padding: 0,
          zIndex: 25,
          opacity: 0,
          willChange: "transform",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: SIZE,
        height: SIZE,
        zIndex: 30,
        touchAction: "none",
        opacity: 0,
        willChange: "transform",
      }}
    >
      <svg
        ref={ringRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ display: "block", cursor: "grab" }}
      >
        {/* Rotated by the effect above to keep the dial aligned with true north. */}
        <g ref={dialRef}>
          <CompassRing />
        </g>
        <HeadingLabel heading={bearing.heading} />
      </svg>
    </div>
  );
}

function CompassRing() {
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const ticks: React.ReactNode[] = [];

  // Background ring (semi-transparent, lets the user drag anywhere on it).
  ticks.push(
    <circle
      key="bg"
      cx={cx}
      cy={cy}
      r={RADIUS + STROKE / 2}
      fill="rgba(17, 24, 39, 0.55)"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth={1}
    />,
    <circle
      key="inner"
      cx={cx}
      cy={cy}
      r={RADIUS - STROKE / 2}
      fill="rgba(0,0,0,0)"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth={1}
    />,
  );

  for (let deg = 0; deg < 360; deg += 10) {
    const isMajor = deg % 30 === 0;
    const isCardinal = deg % 90 === 0;
    const angleRad = ((deg - 90) * Math.PI) / 180; // 0 = north (up)
    // Tick line.
    const r1 = RADIUS + STROKE / 2;
    const r2 = isMajor ? RADIUS : RADIUS + STROKE / 4;
    const x1 = cx + Math.cos(angleRad) * r1;
    const y1 = cy + Math.sin(angleRad) * r1;
    const x2 = cx + Math.cos(angleRad) * r2;
    const y2 = cy + Math.sin(angleRad) * r2;
    ticks.push(
      <line
        key={`t-${deg}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isCardinal ? "#fff" : "rgba(255,255,255,0.7)"}
        strokeWidth={isCardinal ? 2 : 1}
        strokeLinecap="round"
      />,
    );
    if (isMajor) {
      // Place a label just inside the inner ring.
      const labelR = RADIUS - STROKE / 2 - 8;
      const lx = cx + Math.cos(angleRad) * labelR;
      const ly = cy + Math.sin(angleRad) * labelR;
      const text = isCardinal
        ? deg === 0
          ? "N"
          : deg === 90
            ? "E"
            : deg === 180
              ? "S"
              : "W"
        : `${deg}`;
      ticks.push(
        <text
          key={`l-${deg}`}
          x={lx}
          y={ly}
          fill={isCardinal ? "#fbbf24" : "#fff"}
          fontSize={isCardinal ? 10 : 7}
          fontWeight={isCardinal ? 800 : 600}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ pointerEvents: "none" }}
        >
          {text}
        </text>,
      );
    }
  }
  return <g>{ticks}</g>;
}

function HeadingLabel({ heading }: { heading: number }) {
  const cx = SIZE / 2;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect
        x={cx - 26}
        y={SIZE - 28}
        width={52}
        height={20}
        rx={6}
        fill="rgba(17, 24, 39, 0.85)"
      />
      <text
        x={cx}
        y={SIZE - 18}
        fill="#fff"
        fontSize={12}
        fontWeight={800}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {Math.round(heading)}°
      </text>
    </g>
  );
}
