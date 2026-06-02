import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatDistance, getTotalDistanceMeters } from "../../map/geo";
import { useMap } from "../../map/MapContext";
import { useMeasure } from "./context";

export function MeasureOverlay() {
  const { deactivateTool } = useMap();
  const { points, addPoint, removeLastPoint, clear } = useMeasure();

  const distanceMeters = useMemo(
    () => getTotalDistanceMeters(points),
    [points],
  );

  function handleClose() {
    clear();
    deactivateTool();
  }

  return (
    <>
      <View style={styles.status}>
        <View style={styles.statusSection}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={points.length === 0}
            onPress={removeLastPoint}
            style={[
              styles.actionButton,
              points.length === 0 && styles.actionButtonDisabled,
            ]}
          >
            <Ionicons color="#fff" name="backspace-outline" size={20} />
          </TouchableOpacity>
        </View>
        <View style={[styles.statusSection, { flex: 1 }]}>
          <Text style={styles.statusTitle}>Measure</Text>
          <Text style={styles.statusText}>
            {points.length === 0
              ? "Pan the map, then add a point"
              : `${points.length} point${
                  points.length === 1 ? "" : "s"
                } - ${formatDistance(distanceMeters)}`}
          </Text>
        </View>
        <View style={[styles.statusSection, { alignItems: "flex-end" }]}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleClose}
            style={styles.actionButton}
          >
            <Ionicons color="#fff" name="close" size={20} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        accessibilityLabel="Add point"
        accessibilityRole="button"
        onPress={addPoint}
        style={styles.addPointButton}
      >
        <Ionicons color="#fff" name="add" size={32} />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: "center",
    backgroundColor: "#f97316",
    borderColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    width: 24,
  },
  markerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  crosshair: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  crosshairHLine: {
    backgroundColor: "#111827",
    height: 1.5,
    position: "absolute",
    width: 40,
  },
  crosshairVLine: {
    backgroundColor: "#111827",
    height: 40,
    position: "absolute",
    width: 1.5,
  },
  status: {
    backgroundColor: "rgba(17, 24, 39, 0.9)",
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    left: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    right: 16,
    top: 58,
  },
  statusSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
    width: 48,
  },
  actionButtonDisabled: {
    opacity: 0.35,
  },
  statusTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statusText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  addPointButton: {
    alignItems: "center",
    backgroundColor: "#f97316",
    borderRadius: 16,
    bottom: 36,
    elevation: 6,
    height: 52,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    shadowColor: "#000",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    width: 52,
  },
  addPointButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
