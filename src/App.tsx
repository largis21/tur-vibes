import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

import { Crosshair } from "./components/Crosshair";
import { DefaultUi } from "./components/DefaultUi";
import { MapView } from "./components/MapView";
import { OfflineModeBanner } from "./components/OfflineModeBanner";
import { PointInfoModal } from "./components/PointInfoModal";
import { Sidebar } from "./components/Sidebar";
import {
  MapContextProvider,
  type MapContextValue,
  type RegionChangeListener,
} from "./lib/MapContext";
import { registerOfflineProtocols } from "./lib/offlineTiles";
import { PermissionsProvider } from "./lib/permissions";
import { loadLastRegion } from "./lib/persistedRegion";
import { PointInfoProvider } from "./lib/PointInfoContext";
import type { LatLng } from "./lib/types";
import { UiStateProvider, useUiState } from "./lib/UiState";
import { useOffline } from "./tools/offline/context";
import { getActiveTool, tools } from "./tools/registry";

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

  const mapContextValue = useMemo<MapContextValue>(
    () => ({
      mapRef,
      cursorCoordinate,
      regionListeners,
      subscribeRegionChange,
      deactivateTool,
    }),
    [subscribeRegionChange, deactivateTool],
  );

  return (
    <MapContextProvider value={mapContextValue}>
      <PermissionsProvider>
        <UiStateProvider>
          <PointInfoProvider>
            <ToolProviders>
              <AppContent
                activeToolId={activeToolId}
                setActiveToolId={setActiveToolId}
              />
            </ToolProviders>
          </PointInfoProvider>
        </UiStateProvider>
      </PermissionsProvider>
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
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <MapView activeToolId={activeToolId}>
        {MapChildren ? <MapChildren /> : null}
      </MapView>

      <Crosshair visible={activeTool.cursor ?? true} />
      <DefaultUi
        keys={defaultUi}
        bannerVisible={isDefaultTool && offlineMode}
        compassTopOffset={activeTool.id === "navigation" ? 88 : undefined}
      />
      {isDefaultTool && offlineMode ? <OfflineModeBanner /> : null}
      {Overlay ? <Overlay /> : null}
      <PointInfoModal />
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
