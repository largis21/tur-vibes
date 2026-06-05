import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import { Crosshair } from "./components/Crosshair";
import { DefaultUi } from "./components/DefaultUi";
import { MapView } from "./components/MapView";
import { OfflineModeBanner } from "./components/OfflineModeBanner";
import { OnboardingModal } from "./components/OnboardingModal";
import { PointInfoModal } from "./components/PointInfoModal";
import { Sidebar } from "./components/Sidebar";
import {
  MapContextProvider,
  type MapContextValue,
  type RegionChangeListener,
} from "./lib/MapContext";
import { registerOfflineProtocols } from "./lib/offlineTiles";
import { OnboardingProvider } from "./lib/OnboardingContext";
import { PermissionsProvider } from "./lib/permissions";
import { loadLastRegion } from "./lib/persistedRegion";
import { PeakProvider } from "./lib/PeakContext";
import { PeakInfoModal } from "./components/PeakInfoModal";
import { CustomPoiCard } from "./components/CustomPoiCard";
import { PointInfoProvider } from "./lib/PointInfoContext";
import type { LatLng } from "./lib/types";
import { UiStateProvider, useUiState } from "./lib/UiState";
import { useOffline } from "./tools/offline/context";
import { getActiveTool, tools } from "./tools/registry";
import { useNavigation } from "./tools/navigation/context";

registerOfflineProtocols();

const FALLBACK_COORD: LatLng = { latitude: 60.3913, longitude: 5.3221 };

function ToolProviders({ children }: { children: ReactNode }) {
  return tools.reduceRight<ReactNode>((acc, tool) => {
    if (!tool.Provider) return acc;
    const Provider = tool.Provider;
    return <Provider>{acc}</Provider>;
  }, children);
}

export default function App() {
  const mapRef = useRef<MapLibreMap | null>(null);
  const initial = loadLastRegion();
  const cursorCoordinate = useRef<LatLng>(
    initial
      ? { latitude: initial.latitude, longitude: initial.longitude }
      : FALLBACK_COORD,
  );
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

  const [userPosition, setUserPosition] = useState<LatLng | null>(null);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) =>
        setUserPosition({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const mapContextValue = useMemo<MapContextValue>(
    () => ({
      mapRef,
      cursorCoordinate,
      regionListeners,
      subscribeRegionChange,
      deactivateTool,
      userPosition,
    }),
    [subscribeRegionChange, deactivateTool, userPosition],
  );

  return (
    <MapContextProvider value={mapContextValue}>
      <OnboardingProvider>
        <PermissionsProvider>
          <UiStateProvider>
            <PointInfoProvider>
              <PeakProvider>
                <ToolProviders>
                  <AppContent
                    activeToolId={activeToolId}
                    setActiveToolId={setActiveToolId}
                  />
                </ToolProviders>
              </PeakProvider>
            </PointInfoProvider>
          </UiStateProvider>
        </PermissionsProvider>
      </OnboardingProvider>
    </MapContextProvider>
  );
}

type AppContentProps = {
  activeToolId: string | null;
  setActiveToolId: React.Dispatch<React.SetStateAction<string | null>>;
};

function AppContent({ activeToolId, setActiveToolId }: AppContentProps) {
  const { sidebarOpen, closeSidebar } = useUiState();
  const { offlineMode } = useOffline();
  const { tracking: navTracking } = useNavigation();
  const activeTool = getActiveTool(activeToolId);
  const isDefaultTool = activeToolId === null;
  const MapChildren = activeTool.MapChildren;
  const Overlay = activeTool.Overlay;
  const defaultUi = activeTool.defaultUi ?? [];

  function handleSelectTool(id: string) {
    setActiveToolId((current) => (current === id ? null : id));
    closeSidebar();
  }

  return (
    <div className="h-full w-full absolute inset-0 overflow-hidden">
      <MapView activeToolId={activeToolId}>
        {MapChildren ? <MapChildren /> : null}
      </MapView>

      <Crosshair visible={activeTool.cursor ?? true} />
      <DefaultUi
        keys={defaultUi}
        bannerVisible={isDefaultTool && offlineMode}
        compassTopOffset={
          (activeTool.id === "navigation" && !navTracking) ||
          activeTool.id === "poi"
            ? 88
            : undefined
        }
        onOpenPoiTool={
          activeToolId !== "poi" ? () => setActiveToolId("poi") : undefined
        }
      />
      {isDefaultTool && offlineMode ? <OfflineModeBanner /> : null}
      {Overlay ? <Overlay /> : null}
      <PeakInfoModal />
      <CustomPoiCard />
      <PointInfoModal />
      <OnboardingModal />
      <Sidebar
        isOpen={sidebarOpen}
        tools={tools}
        activeToolId={activeToolId}
        onSelectTool={handleSelectTool}
        onClose={closeSidebar}
      />
    </div>
  );
}
