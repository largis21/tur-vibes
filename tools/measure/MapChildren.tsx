import { Polyline } from "react-native-maps";
import { useMeasure } from "./context";

export function MeasureMapChildren() {
  const { points } = useMeasure();
  if (points.length < 2) return null;
  return (
    <Polyline
      coordinates={points}
      geodesic
      strokeColor="#f97316"
      strokeWidth={4}
      zIndex={10}
    />
  );
}
