import { useCallback, useEffect, useState } from "react";
import { useMap } from "../lib/MapContext";

/**
 * Top-right compass button.
 *
 * - Visual needle reflects the map's current bearing.
 * - Tap → rotate map back to north.
 */
export function Compass({ topOffset = 16 }: { topOffset?: number } = {}) {
  const { mapRef } = useMap();
  const [bearing, setBearing] = useState(0);

  // Map → bearing UI sync.
  useEffect(() => {
    let map = mapRef.current;
    let attached = false;
    let cancelled = false;

    const onRotate = () => {
      if (!map) return;
      const b = map.getBearing();
      setBearing(b);
    };

    function attach() {
      map = mapRef.current;
      if (!map) return false;
      map.on("rotate", onRotate);
      map.on("rotateend", onRotate);
      onRotate();
      attached = true;
      return true;
    }

    if (!attach()) {
      const interval = window.setInterval(() => {
        if (cancelled) return;
        if (attach()) window.clearInterval(interval);
      }, 100);
      return () => {
        cancelled = true;
        window.clearInterval(interval);
        if (attached && map) {
          map.off("rotate", onRotate);
          map.off("rotateend", onRotate);
        }
      };
    }

    return () => {
      if (map) {
        map.off("rotate", onRotate);
        map.off("rotateend", onRotate);
      }
    };
  }, [mapRef]);

  const rotateToNorth = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.rotateTo(0, { duration: 100 });
  }, [mapRef]);

  return (
    <button
      type="button"
      aria-label="Reset bearing to north"
      onClick={rotateToNorth}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute right-4 w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-md z-30 cursor-pointer hover:shadow-lg transition-shadow duration-150"
      style={{
        top: topOffset,
      }}
    >
      <svg
        width={28}
        height={28}
        viewBox="0 0 24 24"
        className="transition-transform duration-80"
        style={{
          transform: `rotate(${-bearing}deg)`,
        }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="#e5e7eb" />
        <polygon points="12,3 15,12 12,11 9,12" fill="#dc2626" />
        <polygon points="12,21 9,12 12,13 15,12" fill="#111827" />
      </svg>
    </button>
  );
}
