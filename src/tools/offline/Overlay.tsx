import { useEffect, useRef, useState } from "react";
import { useMap } from "../../lib/MapContext";
import {
  PiCloudArrowDown,
  PiPlus,
  PiTrash,
  PiX,
  PiBackspace,
  PiStop,
  PiDownloadSimple,
} from "react-icons/pi";
import { ModalShell } from "../../components/ModalShell";
import { RegionPreview } from "../../components/RegionPreview";
import { useOffline } from "./context";
import type { SavedOfflineRegion } from "../../lib/savedRegions";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

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

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

function ListView({
  onClose,
  onNewRegion,
  offlineMode,
  setOfflineMode,
  storageBytes,
  savedRegions,
  regionSizes,
  onRemoveRegion,
  downloading,
  progress,
  onResumeCreate,
  onCancelDownload,
}: {
  onClose: () => void;
  onNewRegion: () => void;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  storageBytes: number;
  savedRegions: SavedOfflineRegion[];
  regionSizes: Record<string, number>;
  onRemoveRegion: (id: string) => Promise<void>;
  downloading: boolean;
  progress: { total: number; completed: number; failed: number } | null;
  onResumeCreate: () => void;
  onCancelDownload: () => void;
}) {
  return (
    <ModalShell
      title="Offline maps"
      subtitle={`Stored: ${formatBytes(storageBytes)}`}
      onClose={onClose}
      scrollable
      zIndex={20}
    >
      <div style={toggleRow}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
            Offline mode
          </div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
            Use only downloaded maps. No network requests.
          </div>
        </div>
        <ToggleSwitch checked={offlineMode} onChange={setOfflineMode} />
      </div>

      {/* In-progress download banner */}
      {downloading && progress ? (
        <div
          style={{
            background: "rgba(249, 115, 22, 0.15)",
            border: "1px solid rgba(249, 115, 22, 0.4)",
            borderRadius: 12,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PiCloudArrowDown
              size={16}
              color="#f97316"
              style={{ display: "block", flexShrink: 0 }}
            />
            <span
              style={{
                color: "#f97316",
                fontSize: 13,
                fontWeight: 700,
                flex: 1,
              }}
            >
              Downloading…{" "}
              {progress.total
                ? `${Math.round(((progress.completed + progress.failed) / progress.total) * 100)}%`
                : ""}
            </span>
            <button
              onClick={onResumeCreate}
              style={{
                color: "#d1d5db",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.1)",
              }}
            >
              View
            </button>
            <button
              onClick={onCancelDownload}
              aria-label="Cancel download"
              style={{
                color: "#9ca3af",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.1)",
              }}
            >
              Cancel
            </button>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 4,
              height: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#f97316",
                height: "100%",
                width: `${
                  progress.total
                    ? Math.min(
                        100,
                        ((progress.completed + progress.failed) /
                          progress.total) *
                          100,
                      )
                    : 0
                }%`,
                transition: "width 0.1s linear",
              }}
            />
          </div>
        </div>
      ) : null}

      <div
        style={{
          color: "#d1d5db",
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginTop: 4,
        }}
      >
        Saved areas
      </div>

      <SavedRegionsList
        regions={savedRegions}
        regionSizes={regionSizes}
        onRemove={onRemoveRegion}
      />

      <button onClick={onNewRegion} style={primaryButton}>
        <PiPlus
          size={18}
          color="#fff"
          style={{ display: "block", flexShrink: 0 }}
        />
        <span>New area</span>
      </button>
    </ModalShell>
  );
}

function SavedRegionsList({
  regions,
  regionSizes,
  onRemove,
}: {
  regions: SavedOfflineRegion[];
  regionSizes: Record<string, number>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await onRemove(id);
    } finally {
      setRemovingId(null);
    }
  }

  if (regions.length === 0) {
    return (
      <div
        style={{
          color: "#9ca3af",
          fontSize: 13,
          padding: "12px 4px",
        }}
      >
        No saved areas yet. Tap "New area" to download one.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 12,
        overflowX: "auto",
        overflowY: "hidden",
        paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {regions.map((region) => {
        const isRemoving = removingId === region.id;
        return (
          <div
            key={region.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 10,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              flexShrink: 0,
              width: 160,
            }}
          >
            <RegionPreview polygon={region.polygon} width={140} height={140} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {new Date(region.createdAt).toLocaleDateString()}
              </div>
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 11,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {regionSizes[region.id] != null
                  ? formatBytes(regionSizes[region.id]!)
                  : "…"}
              </div>
            </div>
            <button
              disabled={isRemoving}
              onClick={() => handleRemove(region.id)}
              aria-label="Remove download"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 36,
                borderRadius: 10,
                background: "#dc2626",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                opacity: isRemoving ? 0.4 : 1,
              }}
            >
              <PiTrash
                size={16}
                color="#fff"
                style={{ display: "block", flexShrink: 0 }}
              />
              <span>Remove</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create view
// ---------------------------------------------------------------------------

function CreateView({
  polygon,
  tileCount,
  selfIntersecting,
  downloading,
  progress,
  onAdd,
  onUndo,
  onClear,
  onBack,
  onDownload,
  onCancelDownload,
}: {
  polygon: { latitude: number; longitude: number }[];
  tileCount: number;
  selfIntersecting: boolean;
  downloading: boolean;
  progress: { total: number; completed: number; failed: number } | null;
  onAdd: () => void;
  onUndo: () => void;
  onClear: () => void;
  onBack: () => void;
  onDownload: () => void;
  onCancelDownload: () => void;
}) {
  const estimatedBytes = tileCount * 30 * 1024;
  const canDownload = polygon.length >= 3 && tileCount > 0 && !selfIntersecting;
  const status = selfIntersecting
    ? "Invalid shape – the area's edges cross. Move points so the outline doesn't overlap itself."
    : polygon.length === 0
      ? "Pan and tap + to add a point. Drag points to adjust."
      : polygon.length < 3
        ? `${polygon.length} point${polygon.length === 1 ? "" : "s"} – add ${
            3 - polygon.length
          } more`
        : `${polygon.length} points · ${tileCount.toLocaleString()} tiles · ~${formatBytes(estimatedBytes)}`;

  return (
    <>
      {/* Top status bar */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          background: "rgba(17, 24, 39, 0.94)",
          borderRadius: 16,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          zIndex: 20,
        }}
      >
        <button aria-label="Back" onClick={onBack} style={iconButton}>
          <PiX
            size={20}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            New offline area
          </div>
          <div
            style={{
              color: selfIntersecting ? "#fca5a5" : "#d1d5db",
              fontSize: 12,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {status}
          </div>
        </div>
        <button
          aria-label="Remove last point"
          disabled={polygon.length === 0 || downloading}
          onClick={onUndo}
          style={{
            ...iconButton,
            opacity: polygon.length === 0 || downloading ? 0.35 : 1,
          }}
        >
          <PiBackspace
            size={20}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
        </button>
        <button
          aria-label="Clear"
          disabled={polygon.length === 0 || downloading}
          onClick={onClear}
          style={{
            ...iconButton,
            opacity: polygon.length === 0 || downloading ? 0.35 : 1,
          }}
        >
          <PiTrash
            size={18}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
        </button>
      </div>

      {/* Add-point FAB at the crosshair */}
      {!downloading ? (
        <button
          aria-label="Add point"
          onClick={onAdd}
          style={{
            position: "absolute",
            right: 20,
            bottom: 132,
            width: 56,
            height: 56,
            borderRadius: 18,
            background: "#f97316",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
            zIndex: 20,
          }}
        >
          <PiPlus
            size={32}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
        </button>
      ) : null}

      {/* Bottom action bar */}
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 36,
          background: "rgba(17, 24, 39, 0.94)",
          borderRadius: 16,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 20,
        }}
      >
        {progress && downloading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: 4,
                height: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#f97316",
                  height: "100%",
                  width: `${
                    progress.total
                      ? Math.min(
                          100,
                          ((progress.completed + progress.failed) /
                            progress.total) *
                            100,
                        )
                      : 0
                  }%`,
                  transition: "width 0.1s linear",
                }}
              />
            </div>
            <div
              style={{
                color: "#d1d5db",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {progress.completed + progress.failed}/{progress.total}
              {progress.failed > 0 ? ` (${progress.failed} failed)` : ""}
            </div>
            <div
              style={{
                color: "#6b7280",
                fontSize: 11,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              You can go back — the download continues in the background.
            </div>
          </div>
        ) : null}

        {downloading ? (
          <button
            onClick={onCancelDownload}
            style={{ ...primaryButton, background: "#374151" }}
          >
            <PiStop
              size={18}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
            <span>Stop download</span>
          </button>
        ) : (
          <button
            disabled={!canDownload}
            onClick={onDownload}
            style={{
              ...primaryButton,
              background: "#f97316",
              opacity: canDownload ? 1 : 0.4,
            }}
          >
            <PiDownloadSimple
              size={18}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
            <span>Download</span>
          </button>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: checked ? "#f97316" : "#374151",
        position: "relative",
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: "#fff",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}

const toggleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  justifyContent: "space-between",
};

const iconButton: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: "rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const primaryButton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 14px",
  borderRadius: 12,
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  background: "#f97316",
};

// ---------------------------------------------------------------------------
// Sidebar badge – shown on the tool button while a download is in progress.
// Exported so offline/index.ts can attach it to the tool definition.
// ---------------------------------------------------------------------------

export function OfflineDownloadBadge() {
  const { downloading, progress } = useOffline();
  if (!downloading || !progress) return null;
  const pct = progress.total
    ? Math.round(
        ((progress.completed + progress.failed) / progress.total) * 100,
      )
    : 0;
  return (
    <span
      style={{
        background: "#f97316",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 6,
        padding: "2px 6px",
        marginLeft: 4,
        flexShrink: 0,
      }}
    >
      {pct}%
    </span>
  );
}
