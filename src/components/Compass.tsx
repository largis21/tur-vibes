import { useCallback, useEffect, useRef, useState } from "react";
import { useMap } from "../lib/MapContext";
import { usePermissions } from "../lib/permissions";

const NORTH_THRESHOLD_DEG = 1;
const DOUBLE_TAP_MS = 200;

type IOSOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

/** Read a heading (degrees clockwise from north) from a DeviceOrientationEvent. */
function headingFromEvent(event: IOSOrientationEvent): number | null {
  if (typeof event.webkitCompassHeading === "number") {
    // iOS — already a true compass heading.
    return event.webkitCompassHeading;
  }
  if (event.alpha == null) return null;
  // `alpha` is rotation around z-axis (0 = device's "north"); on most Android
  // browsers this is calibrated against magnetic north. Convert from
  // counter-clockwise (alpha) to clockwise (compass).
  return (360 - event.alpha) % 360;
}

/**
 * Top-right compass button.
 *
 * - Visual needle reflects the map's current bearing.
 * - Tap → rotate map back to north.
 * - Press-and-hold → use the device's compass to drive map bearing live.
 *   Release to stop.
 */
export function Compass({ topOffset = 16 }: { topOffset?: number } = {}) {
  const { mapRef } = useMap();
  const { orientation } = usePermissions();
  const [bearing, setBearing] = useState(0);
  const [tracking, setTracking] = useState(false);
  const wasNearNorth = useRef(true);

  // Map → bearing UI sync (also drives near-north haptics).
  useEffect(() => {
    let map = mapRef.current;
    let attached = false;
    let cancelled = false;

    const onRotate = () => {
      if (!map) return;
      const b = map.getBearing();
      setBearing(b);
      const signed = ((b + 540) % 360) - 180;
      const near = Math.abs(signed) < NORTH_THRESHOLD_DEG;
      wasNearNorth.current = near;
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

  // Double-tap to start tracking lifecycle.
  const trackingRef = useRef(false);
  const orientationHandlerRef = useRef<((e: Event) => void) | null>(null);
  // Per-session cleanup registered by beginOrientationListener (rAF + map event handlers).
  const extraCleanupRef = useRef<(() => void) | null>(null);

  const stopTracking = useCallback(() => {
    if (orientationHandlerRef.current) {
      window.removeEventListener(
        "deviceorientation",
        orientationHandlerRef.current,
      );
      orientationHandlerRef.current = null;
    }
    if (extraCleanupRef.current) {
      extraCleanupRef.current();
      extraCleanupRef.current = null;
    }
    if (trackingRef.current) {
      trackingRef.current = false;
      setTracking(false);
    }
  }, []);

  /**
   * Returns the iOS DeviceOrientationEvent constructor IF it requires explicit
   * permission, otherwise null. Used to decide whether we need a modal.
   */
  const beginOrientationListener = useCallback(() => {
    if (trackingRef.current) return;
    trackingRef.current = true;
    setTracking(true);

    let pendingHeading: number | null = null;
    let rafId: number | null = null;

    // Pause heading updates while the user is actively interacting (panning,
    // zooming, pinch-rotating). Otherwise our 60Hz `setBearing` calls cancel
    // the gesture mid-flight.
    let userInteracting = false;
    const map = mapRef.current;
    const onUserStart = () => {
      userInteracting = true;
    };
    const onUserEnd = () => {
      userInteracting = false;
    };
    if (map) {
      map.on("dragstart", onUserStart);
      map.on("zoomstart", onUserStart);
      map.on("pitchstart", onUserStart);
      map.on("touchstart", onUserStart);
      map.on("dragend", onUserEnd);
      map.on("zoomend", onUserEnd);
      map.on("pitchend", onUserEnd);
      map.on("touchend", onUserEnd);
      map.on("touchcancel", onUserEnd);
    }

    const apply = () => {
      rafId = null;
      const m = mapRef.current;
      if (!m || pendingHeading == null) return;
      if (userInteracting) return; // Don't fight the user.
      m.setBearing(pendingHeading);
    };

    const handler = (e: Event) => {
      const heading = headingFromEvent(e as IOSOrientationEvent);
      if (heading == null) return;
      pendingHeading = heading;
      if (rafId == null) {
        rafId = window.requestAnimationFrame(apply);
      }
    };
    orientationHandlerRef.current = handler;
    window.addEventListener("deviceorientation", handler);

    // Override stopTracking-cleanup with one that also detaches map listeners.
    const cleanup = () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (map) {
        map.off("dragstart", onUserStart);
        map.off("zoomstart", onUserStart);
        map.off("pitchstart", onUserStart);
        map.off("touchstart", onUserStart);
        map.off("dragend", onUserEnd);
        map.off("zoomend", onUserEnd);
        map.off("pitchend", onUserEnd);
        map.off("touchend", onUserEnd);
        map.off("touchcancel", onUserEnd);
      }
    };
    extraCleanupRef.current = cleanup;
  }, [mapRef]);

  // If the user revokes orientation access while tracking, stop immediately.
  useEffect(() => {
    if (orientation !== "granted" && trackingRef.current) {
      stopTracking();
    }
  }, [orientation, stopTracking]);

  /**
   * Modal "Allow" button click — fires synchronously inside a user gesture,
   * which iOS requires for `requestPermission()`.
   */
  // Cleanup on unmount.
  useEffect(() => stopTracking, [stopTracking]);

  function rotateToNorth() {
    const map = mapRef.current;
    if (!map) return;
    map.rotateTo(0, { duration: 100 });
  }

  // --- Pointer handlers -----------------------------------------------------
  const lastTapAt = useRef(0);
  const singleTapTimer = useRef<number | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault(); // Block iOS text-callout / accidental selection.

    // Tap while tracking → stop tracking.
    if (trackingRef.current) {
      stopTracking();
      lastTapAt.current = 0;
      return;
    }

    const now = performance.now();
    const isDoubleTap = now - lastTapAt.current < DOUBLE_TAP_MS;
    lastTapAt.current = now;

    if (isDoubleTap) {
      if (singleTapTimer.current != null) {
        window.clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      // Orientation must be granted via the Permissions tool. If not, fall
      // back to a plain rotate-to-north so the gesture is never a dead end.
      if (orientation !== "granted") {
        rotateToNorth();
        return;
      }
      beginOrientationListener();
      return;
    }

    // First tap → wait briefly to see if a second tap arrives. If not, treat
    // as a plain tap and rotate to north.
    if (singleTapTimer.current != null) {
      window.clearTimeout(singleTapTimer.current);
    }
    singleTapTimer.current = window.setTimeout(() => {
      singleTapTimer.current = null;
      rotateToNorth();
    }, DOUBLE_TAP_MS);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Reset bearing to north (double-tap to track device compass)"
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: "absolute",
          top: topOffset,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: 24,
          background: tracking ? "#fde68a" : "#fff",
          color: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: tracking
            ? "0 0 0 3px rgba(245, 158, 11, 0.45), 0 3px 6px rgba(0,0,0,0.25)"
            : "0 3px 6px rgba(0,0,0,0.25)",
          zIndex: 30,
          transition: "top 0.18s ease",
        }}
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 24 24"
          style={{
            transform: `rotate(${-bearing}deg)`,
            transition: "transform 80ms linear",
          }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10.5" fill="none" stroke="#e5e7eb" />
          <polygon points="12,3 15,12 12,11 9,12" fill="#dc2626" />
          <polygon points="12,21 9,12 12,13 15,12" fill="#111827" />
        </svg>
      </button>
    </>
  );
}
