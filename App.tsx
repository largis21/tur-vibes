import { Ionicons } from "@expo/vector-icons";
import { Directory, File, Paths } from "expo-file-system";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Polyline,
  UrlTile,
  type LatLng,
  type Region,
} from "react-native-maps";

const KARTVERKET_TOPO_TILES =
  "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png";

const INITIAL_REGION = {
  latitude: 60.3913,
  longitude: 5.3221,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const KARTVERKET_TILE_CACHE = new Directory(Paths.cache, "kartverket-tiles");
const KARTVERKET_TILE_CACHE_RETENTION_SECONDS = 60 * 60 * 24 * 7;
const KARTVERKET_TILE_CACHE_RETENTION_MS =
  KARTVERKET_TILE_CACHE_RETENTION_SECONDS * 1000;
const EARTH_RADIUS_METERS = 6371000;

function pruneExpiredTileFiles(directory: Directory, cutoffTime: number) {
  for (const entry of directory.list()) {
    if (entry instanceof Directory) {
      pruneExpiredTileFiles(entry, cutoffTime);
      continue;
    }

    if (entry instanceof File && entry.modificationTime !== null) {
      if (entry.modificationTime < cutoffTime) {
        entry.delete();
      }
    }
  }
}

function useKartverketTileCache() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      KARTVERKET_TILE_CACHE.create({ idempotent: true, intermediates: true });
      pruneExpiredTileFiles(
        KARTVERKET_TILE_CACHE,
        Date.now() - KARTVERKET_TILE_CACHE_RETENTION_MS,
      );
    }, 0);

    return () => clearTimeout(timeout);
  }, []);
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getDistanceMeters(start: LatLng, end: LatLng) {
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function getTotalDistanceMeters(points: LatLng[]) {
  return points.reduce((totalDistance, point, index) => {
    if (index === 0) return totalDistance;

    return totalDistance + getDistanceMeters(points[index - 1], point);
  }, 0);
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

export default function App() {
  useKartverketTileCache();
  const mapRef = useRef<MapView>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(0)).current;

  function openSidebar() {
    setIsToolsOpen(true);
    Animated.spring(sidebarAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }

  function closeSidebar() {
    Animated.spring(sidebarAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start(() => setIsToolsOpen(false));
  }
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<LatLng[]>([]);
  const [markerPositions, setMarkerPositions] = useState<
    { x: number; y: number }[]
  >([]);
  const cursorCoordinate = useRef<LatLng>({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  });
  const measuredDistance = useMemo(
    () => getTotalDistanceMeters(measurePoints),
    [measurePoints],
  );

  async function updateMarkerPositions(points: LatLng[]) {
    if (!mapRef.current || points.length === 0) {
      setMarkerPositions([]);
      return;
    }
    const positions = await Promise.all(
      points.map((p) => mapRef.current!.pointForCoordinate(p)),
    );
    setMarkerPositions(positions);
  }

  function handleRegionChange(region: Region) {
    cursorCoordinate.current = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
    updateMarkerPositions(measurePoints);
  }

  function handleAddPoint() {
    const newPoint = cursorCoordinate.current;
    // const { width, height } = Dimensions.get("window");
    setMeasurePoints((currentPoints) => {
      const next = [...currentPoints, newPoint];
      // setMarkerPositions((prev) => [...prev, { x: width / 2, y: height / 2 }]);
      updateMarkerPositions(next);
      return next;
    });
  }

  function handleMeasurePress() {
    setIsMeasuring((currentlyMeasuring) => !currentlyMeasuring);
    closeSidebar();
  }

  return (
    <>
      <StatusBar hidden />
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        mapType={Platform.OS === "android" ? "none" : "standard"}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChange}
        rotateEnabled={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        <UrlTile
          maximumNativeZ={18}
          shouldReplaceMapContent
          // A zero native max age updates file mtimes on cache hits; JS pruning enforces retention.
          tileCacheMaxAge={0}
          tileCachePath={KARTVERKET_TILE_CACHE.uri}
          tileSize={256}
          urlTemplate={KARTVERKET_TOPO_TILES}
        />
        {measurePoints.length > 1 ? (
          <Polyline
            coordinates={measurePoints}
            geodesic
            strokeColor="#f97316"
            strokeWidth={4}
            zIndex={10}
          />
        ) : null}
      </MapView>
      {markerPositions.map((pos, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[styles.measureMarker, { left: pos.x - 12, top: pos.y - 12 }]}
        >
          <Text style={styles.measureMarkerText}>{index + 1}</Text>
        </View>
      ))}
      {isMeasuring ? (
        <>
          <View style={styles.crosshair} pointerEvents="none">
            <View style={styles.crosshairHLine} />
            <View style={styles.crosshairVLine} />
          </View>
          <View style={styles.measureStatus}>
            <View style={styles.measureStatusHeaderSection}>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={measurePoints.length === 0}
                onPress={() =>
                  setMeasurePoints((p) => {
                    const next = p.slice(0, -1);
                    updateMarkerPositions(next);
                    return next;
                  })
                }
                style={[
                  styles.measureActionButton,
                  measurePoints.length === 0 &&
                    styles.measureActionButtonDisabled,
                ]}
              >
                <Ionicons color="#fff" name="backspace-outline" size={20} />
              </TouchableOpacity>
            </View>
            <View style={{ ...styles.measureStatusHeaderSection, flex: 1 }}>
              <Text style={styles.measureStatusTitle}>Measure</Text>

              <Text style={styles.measureStatusText}>
                {measurePoints.length === 0
                  ? "Pan the map, then add a point"
                  : `${measurePoints.length} point${
                      measurePoints.length === 1 ? "" : "s"
                    } - ${formatDistance(measuredDistance)}`}
              </Text>
            </View>
            <View
              style={[
                styles.measureStatusHeaderSection,
                { alignItems: "flex-end" },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setIsMeasuring(false);
                  setMeasurePoints([]);
                  setMarkerPositions([]);
                }}
                style={styles.measureActionButton}
              >
                <Ionicons color="#fff" name="close" size={20} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleAddPoint}
            style={styles.addPointButton}
          >
            <Text style={styles.addPointButtonText}>+ Add point</Text>
          </TouchableOpacity>
        </>
      ) : null}
      {isToolsOpen ? (
        <>
          <Animated.View
            pointerEvents={isToolsOpen ? "auto" : "none"}
            style={[styles.sidebarBackdrop, { opacity: sidebarAnim }]}
          >
            <Pressable
              accessibilityLabel="Close tools"
              style={StyleSheet.absoluteFill}
              onPress={closeSidebar}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.sidebar,
              {
                transform: [
                  {
                    translateX: sidebarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [280, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Tools</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={closeSidebar}
                style={styles.closeButton}
              >
                <Ionicons color="#111827" name="close" size={22} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleMeasurePress}
              style={[
                styles.toolButton,
                isMeasuring ? styles.toolButtonActive : null,
              ]}
            >
              <Text
                style={[
                  styles.toolButtonText,
                  isMeasuring ? styles.toolButtonTextActive : null,
                ]}
              >
                Measure distance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={measurePoints.length === 0}
              onPress={() => setMeasurePoints([])}
              style={[
                styles.secondaryToolButton,
                measurePoints.length === 0 ? styles.disabledButton : null,
              ]}
            >
              <Text style={styles.secondaryToolButtonText}>
                Clear measurement
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : null}
      <TouchableOpacity
        accessibilityLabel="Open tools"
        accessibilityRole="button"
        onPress={() => (isToolsOpen ? closeSidebar() : openSidebar())}
        style={styles.menuButton}
      >
        <Ionicons color="#fff" name="menu" size={28} />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    alignItems: "center",
    backgroundColor: "#111827",
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
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
  },
  sidebar: {
    backgroundColor: "#fff",
    bottom: 0,
    elevation: 7,
    paddingHorizontal: 20,
    paddingTop: 56,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { height: 0, width: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    top: 0,
    width: 280,
  },
  sidebarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sidebarTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  toolButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toolButtonActive: {
    backgroundColor: "#f97316",
  },
  toolButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  toolButtonTextActive: {
    color: "#fff",
  },
  secondaryToolButton: {
    borderColor: "#d1d5db",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.4,
  },
  secondaryToolButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
  measureStatus: {
    gap: 12,
    backgroundColor: "rgba(17, 24, 39, 0.9)",
    borderRadius: 16,
    left: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    right: 16,
    top: 58,
    display: "flex",
    flexDirection: "row",
  },
  measureStatusHeader: {
    alignItems: "center",
    flexDirection: "row",
  },
  measureStatusHeaderSection: {
    justifyContent: "center",
    alignItems: "center",
  },
  measureStatusActions: {},
  measureActionButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    width: 48,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  measureActionButtonDisabled: {    opacity: 0.35,
  },
  measureStatusTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  measureStatusText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  measureMarker: {
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
  measureMarkerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  crosshair: {
    ...StyleSheet.absoluteFillObject,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
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
  addPointButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#f97316",
    borderRadius: 28,
    bottom: 36,
    elevation: 6,
    paddingHorizontal: 28,
    paddingVertical: 16,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  addPointButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
