import { useSyncExternalStore } from "react";
import { logger } from "./logger";

type Listener = (heading: number | null) => void;

const listeners = new Set<Listener>();
let attached = false;
let lastHeading: number | null = null;

type IOSOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

/** Convert a DeviceOrientationEvent to a clockwise-from-true-north heading. */
function headingFromEvent(event: IOSOrientationEvent): number | null {
  if (typeof event.webkitCompassHeading === "number") {
    return event.webkitCompassHeading;
  }
  if (event.alpha == null) return null;
  // `alpha` is degrees CCW from device north → convert to CW.
  return (360 - event.alpha) % 360;
}

function notify() {
  for (const l of listeners) l(lastHeading);
}

function onOrientation(e: Event) {
  const h = headingFromEvent(e as IOSOrientationEvent);
  if (h == null) return;
  lastHeading = h;
  notify();
}

function start() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("deviceorientationabsolute", onOrientation);
  window.addEventListener("deviceorientation", onOrientation);
}

function stop() {
  if (!attached || typeof window === "undefined") return;
  attached = false;
  window.removeEventListener("deviceorientationabsolute", onOrientation);
  window.removeEventListener("deviceorientation", onOrientation);
  lastHeading = null;
}

/**
 * Subscribe to device-compass-heading updates. The underlying event listeners
 * are attached on the first subscription and detached when the last
 * subscriber unsubscribes.
 *
 * Heading is reported in degrees clockwise from true north (0 = N).
 */
export function subscribeDeviceHeading(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) start();
  if (lastHeading != null) {
    queueMicrotask(() => {
      if (listeners.has(listener)) listener(lastHeading);
    });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

/** Synchronous snapshot of the latest heading, or null if none. */
export function getDeviceHeadingSnapshot(): number | null {
  return lastHeading;
}

/**
 * React hook reading the singleton device-heading feed via
 * `useSyncExternalStore`. Heading is in degrees clockwise from true north.
 */
export function useDeviceHeading(): number | null {
  return useSyncExternalStore(
    (cb) => subscribeDeviceHeading(() => cb()),
    getDeviceHeadingSnapshot,
    () => null,
  );
}

type IOSOrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function getIOSOrientationCtor(): IOSOrientationCtor | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.DeviceOrientationEvent as IOSOrientationCtor | undefined;
  if (!Ctor || typeof Ctor.requestPermission !== "function") return null;
  return Ctor;
}

/**
 * Request device orientation permission from the user. On iOS, this triggers
 * a permission prompt. On other platforms, orientation events are available
 * without a prompt.
 */
export async function requestDeviceOrientation(): Promise<void> {
  const Ctor = getIOSOrientationCtor();
  if (!Ctor) {
    // Non-iOS: orientation events are available without a prompt.
    return;
  }
  try {
    // Must be called synchronously inside a user gesture (the toggle click).
    await Ctor.requestPermission!();
  } catch (err) {
    logger.warn("Device orientation permission request failed", {
      source: "deviceOrientation",
      error: err,
    });
  }
}
