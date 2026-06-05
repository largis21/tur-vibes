import { useEffect, useRef, useState } from "react";
import { useMap } from "../../lib/MapContext";
import { useOffline } from "./context";
import { ListView } from "./OfflineListView";
import { CreateView } from "./OfflineCreateView";

type Mode = "list" | "create";

export function OfflineOverlay() {
  const { deactivateTool } = useMap();
  const offline = useOffline();
  const {
    polygon,
    addPolygonPoint,
    removeLastPolygonPoint,
    clearPolygon,
    selfIntersecting,
    tileCount,
    downloading,
    progress,
    storageBytes,
    startDownload,
    cancelDownload,
    offlineMode,
    setOfflineMode,
    savedRegions,
    removeSavedRegion,
    regionSizes,
  } = offline;

  const [mode, setMode] = useState<Mode>("list");
  const wasDownloading = useRef(false);

  // After a download finishes, the context clears the polygon. Return to
  // the list view so the user sees their new saved region.
  useEffect(() => {
    if (wasDownloading.current && !downloading) {
      if (polygon.length === 0) setMode("list");
    }
    wasDownloading.current = downloading;
  }, [downloading, polygon.length]);

  function enterCreate() {
    clearPolygon();
    setMode("create");
  }

  function exitCreate() {
    if (downloading) {
      // Let the download keep running — just return to the list.
      setMode("list");
      return;
    }
    clearPolygon();
    setMode("list");
  }

  function handleClose() {
    // If a download is running, leave it running in the background.
    if (mode === "create" && !downloading) {
      clearPolygon();
    }
    deactivateTool();
  }

  if (mode === "create") {
    return (
      <CreateView
        polygon={polygon}
        tileCount={tileCount}
        selfIntersecting={selfIntersecting}
        downloading={downloading}
        progress={progress}
        onAdd={addPolygonPoint}
        onUndo={removeLastPolygonPoint}
        onClear={clearPolygon}
        onBack={exitCreate}
        onDownload={startDownload}
        onCancelDownload={cancelDownload}
      />
    );
  }

  return (
    <ListView
      onClose={handleClose}
      onNewRegion={enterCreate}
      offlineMode={offlineMode}
      setOfflineMode={setOfflineMode}
      storageBytes={storageBytes}
      savedRegions={savedRegions}
      regionSizes={regionSizes}
      onRemoveRegion={removeSavedRegion}
      downloading={downloading}
      progress={progress}
      onResumeCreate={() => setMode("create")}
      onCancelDownload={cancelDownload}
    />
  );
}

/**
 * Sidebar badge – shown on the tool button while a download is in progress.
 * Exported so offline/index.ts can attach it to the tool definition.
 */
export function OfflineDownloadBadge() {
  const { downloading, progress } = useOffline();
  if (!downloading || !progress) return null;
  const pct = progress.total
    ? Math.round(
        ((progress.completed + progress.failed) / progress.total) * 100,
      )
    : 0;
  return (
    <span className="bg-orange-500 text-white text-xs font-bold rounded-md px-1.5 py-0.5 ml-1 flex-shrink-0">
      {pct}%
    </span>
  );
}
