import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  LocalTile,
  UrlTile,
  type LatLng,
  type Region,
} from "react-native-maps";
import { CoordsBox } from "./map/CoordsBox";
import { Crosshair } from "./map/Crosshair";
import {
  MapContextProvider,
  type MapContextValue,
  type RegionChangeListener,
} from "./map/MapContext";
import { getOfflinePathTemplate } from "./map/offlineTiles";
import { SavedRegionsOverlay } from "./map/SavedRegionsOverlay";
import { loadLastRegion, saveLastRegion } from "./map/persistedRegion";
import {
  KARTVERKET_TILE_CACHE,
  KARTVERKET_TOPO_TILES,
  STEEPNESS_RUNOUT_TILES,
  STEEPNESS_TILE_CACHE,
  useKartverketTileCache,
} from "./map/tileCache";
import { useOffline } from "./tools/offline/context";
import { Sidebar } from "./tools/Sidebar";
import { getToolById, tools } from "./tools/registry";

const AnimatedUrlTile = Animated.createAnimatedComponent(UrlTile);

function ToolProviders({ children }: { children: ReactNode }) {
  return tools.reduceRight<ReactNode>((acc, tool) => {
    if (!tool.Provider) return acc;
    const Provider = tool.Provider;
    return <Provider>{acc}</Provider>;
  }, children);
}

const DEFAULT_REGION = {
  latitude: 60.3913,
  longitude: 5.3221,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const INITIAL_REGION = loadLastRegion() ?? DEFAULT_REGION;

export default function App() {
  useKartverketTileCache();

  const mapRef = useRef<MapView>(null);
  const cursorCoordinate = useRef<LatLng>({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  });
  const regionListeners = useRef(new Set<RegionChangeListener>());

  const subscribeRegionChange = useCallback(
    (listener: RegionChangeListener) => {
      regionListeners.current.add(listener);
      return () => {
        regionListeners.current.delete(listener);
      };
    },
    [],
  );

  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const deactivateTool = useCallback(() => setActiveToolId(null), []);

  const mapContextValue = useMemo<MapContextValue>(
    () => ({
      mapRef,
      cursorCoordinate,
      subscribeRegionChange,
      deactivateTool,
    }),
    [subscribeRegionChange, deactivateTool],
  );

  const handleRegionChange = useCallback((region: Region) => {
    cursorCoordinate.current = {
      latitude: region.latitude,
      longitude: region.longitude,
    };
    regionListeners.current.forEach((listener) => listener(region));
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      handleRegionChange(region);
      saveLastRegion(region);
    },
    [handleRegionChange],
  );

  return (
    <MapContextProvider value={mapContextValue}>
      <ToolProviders>
        <AppContent
          activeToolId={activeToolId}
          mapRef={mapRef}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          setActiveToolId={setActiveToolId}
        />
      </ToolProviders>
    </MapContextProvider>
  );
}

type AppContentProps = {
  activeToolId: string | null;
  mapRef: React.RefObject<MapView | null>;
  onRegionChange: (region: Region) => void;
  onRegionChangeComplete: (region: Region) => void;
  setActiveToolId: React.Dispatch<React.SetStateAction<string | null>>;
};

function AppContent({
  activeToolId,
  mapRef,
  onRegionChange,
  onRegionChangeComplete,
  setActiveToolId,
}: AppContentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSteepness, setShowSteepness] = useState(false);
  const { offlineMode, savedRegions, selectionBounds } = useOffline();
  const activeTool = getToolById(activeToolId);

  function handleSelectTool(id: string) {
    setActiveToolId((current) => (current === id ? null : id));
    setIsSidebarOpen(false);
  }

  async function handleCenterOnUser() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      },
      { duration: 500 },
    );
  }

  const MapChildren = activeTool?.MapChildren;
  const Overlay = activeTool?.Overlay;

  return (
    <>
      <StatusBar hidden />
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        mapType="satellite"
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        rotateEnabled
        showsCompass
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsScale={false}
        showsUserLocation
        toolbarEnabled={false}
      >
        <LocalTile
          pathTemplate={getOfflinePathTemplate("topo")}
          tileSize={256}
          zIndex={-1}
        />
        {!offlineMode ? (
          <UrlTile
            maximumNativeZ={18}
            shouldReplaceMapContent
            tileCacheMaxAge={0}
            tileCachePath={KARTVERKET_TILE_CACHE.uri}
            tileSize={256}
            urlTemplate={KARTVERKET_TOPO_TILES}
          />
        ) : null}
        {!offlineMode ? (
          <AnimatedUrlTile
            style={{ opacity: showSteepness ? 0.5 : 0 }}
            maximumNativeZ={16}
            tileCacheMaxAge={60 * 60 * 24 * 7}
            tileCachePath={STEEPNESS_TILE_CACHE.uri}
            tileSize={256}
            urlTemplate={STEEPNESS_RUNOUT_TILES}
            zIndex={1}
          />
        ) : null}
        {showSteepness ? (
          <LocalTile
            pathTemplate={getOfflinePathTemplate("steepness")}
            tileSize={256}
            zIndex={2}
          />
        ) : null}
        <SavedRegionsOverlay
          regions={savedRegions}
          selectionBounds={activeToolId === "offline" ? selectionBounds : null}
        />
        {MapChildren ? <MapChildren /> : null}
      </MapView>
      <Crosshair visible={activeTool?.cursor ?? true} />
      {!activeTool ? <CoordsBox /> : null}
      {offlineMode && activeToolId !== "offline" ? <OfflineModeBanner /> : null}
      {Overlay ? <Overlay /> : null}
      <Sidebar
        isOpen={isSidebarOpen}
        tools={tools}
        activeToolId={activeToolId}
        onSelectTool={handleSelectTool}
        onClose={() => setIsSidebarOpen(false)}
      />
      {!activeTool ? (
        <View style={styles.defaultButtons}>
          <TouchableOpacity
            accessibilityLabel="Toggle steepness layer"
            accessibilityRole="button"
            onPress={() => setShowSteepness((value) => !value)}
            style={[
              styles.defaultButton,
              showSteepness && styles.layerButtonActive,
            ]}
          >
            <Ionicons
              color={showSteepness ? "#fff" : "#111827"}
              name="trending-up"
              size={24}
            />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Center on my location"
            accessibilityRole="button"
            onPress={handleCenterOnUser}
            style={styles.defaultButton}
          >
            <Ionicons color="#111827" name="locate" size={26} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Open tools"
            accessibilityRole="button"
            onPress={() => setIsSidebarOpen((open) => !open)}
            style={styles.defaultButton}
          >
            <Ionicons color="#111827" name="menu" size={28} />
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

function OfflineModeBanner() {
  const { setOfflineMode } = useOffline();
  return (
    <View style={styles.banner}>
      <Ionicons color="#fff" name="cloud-offline" size={18} />
      <Text style={styles.bannerText}>Offline mode</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setOfflineMode(false)}
        style={styles.bannerButton}
      >
        <Text style={styles.bannerButtonText}>Disable</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  defaultButtons: {
    position: "absolute",
    right: 20,
    bottom: 40,
    gap: 12,
    flexDirection: "column",
  },
  defaultButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    width: 52,
  },
  layerButtonActive: {
    backgroundColor: "#f97316",
  },
  banner: {
    alignItems: "center",
    backgroundColor: "rgba(249, 115, 22, 0.95)",
    flexDirection: "row",
    gap: 8,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    right: 16,
    top: 60,
    borderRadius: 12,
  },
  bannerText: {
    color: "#fff",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  bannerButton: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bannerButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
