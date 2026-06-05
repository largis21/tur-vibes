import { useEffect, useRef } from "react";
import { useMap } from "../../lib/MapContext";
import type { Bearing } from "./context";

const LABEL_OFFSET_PX = 130;

function formatHeading(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const dir = dirs[Math.round(deg / 45) % 8]!;
  return `${Math.round(deg)}°\u2002${dir}`;
}

/**
 * Renders an HTML label at a fixed pixel offset along the bearing direction
 * from the bearing's origin point. Stays in sync with map pan/zoom/rotate.
 */
export function BearingLabel({ bearing }: { bearing: Bearing }) {
  const { mapRef } = useMap();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sync = () => {
      const el = containerRef.current;
      if (!el) return;
      const origin = map.project([
        bearing.point.longitude,
        bearing.point.latitude,
      ]);
      const mapBearing = map.getBearing();
      // Heading relative to screen (north = up when map bearing = 0).
      const screenAngleRad = ((bearing.heading - mapBearing) * Math.PI) / 180;
      const x = origin.x + Math.sin(screenAngleRad) * LABEL_OFFSET_PX;
      const y = origin.y - Math.cos(screenAngleRad) * LABEL_OFFSET_PX;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (el.style.opacity !== "1") el.style.opacity = "1";
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
  }, [
    bearing.point.latitude,
    bearing.point.longitude,
    bearing.heading,
    mapRef,
  ]);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 opacity-0 pointer-events-none"
      style={{
        transform: "translate3d(-9999px,-9999px,0)",
      }}
    >
      <div
        className="bg-orange-500/92 text-white text-xs font-black px-2.5 py-1 rounded-lg whitespace-nowrap -translate-x-1/2 -translate-y-1/2 shadow-md tracking-normal"
        style={{ letterSpacing: 0.3 }}
      >
        {formatHeading(bearing.heading)}
      </div>
    </div>
  );
}
