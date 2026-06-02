import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { LatLng } from "react-native-maps";
import { useMap } from "./MapContext";

function formatCoord(coord: LatLng | null) {
  if (!coord) return "—";
  return `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`;
}

export function CoordsBox() {
  const { cursorCoordinate, subscribeRegionChange } = useMap();
  const [cursor, setCursor] = useState<LatLng>(cursorCoordinate.current);
  const [user, setUser] = useState<LatLng | null>(null);

  useEffect(() => {
    return subscribeRegionChange((region) => {
      setCursor({ latitude: region.latitude, longitude: region.longitude });
    });
  }, [subscribeRegionChange]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5,
          timeInterval: 2000,
        },
        (location) => {
          setUser({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        },
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Cursor</Text>
        <Text style={styles.value}>{formatCoord(cursor)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>You</Text>
        <Text style={styles.value}>{formatCoord(user)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(17, 24, 39, 0.85)",
    borderRadius: 12,
    bottom: 36,
    gap: 4,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "absolute",
  },
  row: {
    flexDirection: "column",
  },
  label: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  value: {
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "600",
  },
});
