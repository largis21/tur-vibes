import { type ReactNode } from "react";

import { Crosshair } from "./components/Crosshair";
import { DefaultUi } from "./components/DefaultUi";
import { MapView } from "./components/MapView";
import { OfflineModeBanner } from "./components/OfflineModeBanner";
import { PointInfoModal } from "./components/PointInfoModal";
import { Sidebar } from "./components/Sidebar";
import { ActiveToolProvider, useActiveTool } from "./lib/ActiveToolContext";
import { MapContextProvider } from "./lib/MapContext";
import { registerOfflineProtocols } from "./lib/offlineTiles";
import { loadLastRegion } from "./lib/persistedRegion";
import { PeakProvider } from "./lib/PeakContext";
import { PeakInfoModal } from "./components/PeakInfoModal";
import { CustomPoiCard } from "./components/CustomPoiCard";
import { PointInfoProvider } from "./lib/PointInfoContext";
import type { LatLng } from "./lib/types";
import { UiStateProvider, useUiState } from "./lib/UiState";
import { useOffline } from "./tools/offline/context";
import { getActiveTool, tools } from "./tools/registry";
import { GeoLocationProvider } from "./state/geoLocation/GeoLocationContext";

registerOfflineProtocols();

const FALLBACK_COORD: LatLng = { latitude: 65.3913, longitude: 5.3221 };

function ToolProviders({ children }: { children: ReactNode }) {
  return tools.reduceRight<ReactNode>((acc, tool) => {
    if (!tool.Provider) return acc;
    const Provider = tool.Provider;
    return <Provider>{acc}</Provider>;
  }, children);
}

export default function App() {
  const initial = loadLastRegion();
  const initialCursor: LatLng = initial
    ? { latitude: initial.latitude, longitude: initial.longitude }
    : FALLBACK_COORD;

  return (
    <GeoLocationProvider>
      <MapContextProvider initialCursor={initialCursor}>
        <ActiveToolProvider>
          <UiStateProvider>
            <PointInfoProvider>
              <PeakProvider>
                <ToolProviders>
                  <AppContent />
                </ToolProviders>
              </PeakProvider>
            </PointInfoProvider>
          </UiStateProvider>
        </ActiveToolProvider>
      </MapContextProvider>
    </GeoLocationProvider>
  );
}

function AppContent() {
  const { activeToolId, setActiveToolId, toggleTool } = useActiveTool();
  const { sidebarOpen, closeSidebar } = useUiState();
  const { offlineMode } = useOffline();
  const activeTool = getActiveTool(activeToolId);
  const isDefaultTool = activeToolId === null;
  const MapChildren = activeTool.MapChildren;
  const Overlay = activeTool.Overlay;
  const defaultUi = activeTool.defaultUi ?? [];

  function handleSelectTool(id: string) {
    toggleTool(id);
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
          activeTool.id === "poi" || activeTool.id === "bearing" // TODO move to tool def
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
