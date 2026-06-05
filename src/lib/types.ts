export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type ElevationGrid = {
  center: LatLng;
  radiusMeters: number;
  gridSize: number;
  points: Array<LatLng & { elevation: number | null }>;
};
