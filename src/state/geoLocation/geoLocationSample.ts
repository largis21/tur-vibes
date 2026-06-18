export type GeolocationSample = {
  latitude: number;
  longitude: number;
  /** Accuracy in meters. */
  accuracy: number;
  /** Altitude in meters above WGS84 ellipsoid, when available. */
  altitude: number | null;
  /** Speed in m/s, when available. */
  speed: number | null;
  /** Heading in degrees clockwise from true north, when available. */
  heading: number | null;
  /** Wall-clock timestamp of the fix. */
  timestamp: number;
};

export function createGeoLocationSample(
  p: GeolocationPosition,
): GeolocationSample {
  return {
    latitude: p.coords.latitude,
    longitude: p.coords.longitude,
    accuracy: p.coords.accuracy,
    altitude: p.coords.altitude,
    speed: p.coords.speed,
    heading: p.coords.heading,
    timestamp: p.timestamp,
  };
}
