import { useState } from "react";
import { useMap } from "../../lib/MapContext";
import { Icon } from "../../components/Icon";
import { RegionPreview } from "../../components/RegionPreview";
import { DOWNLOAD_BOX_INSETS, useOffline } from "./context";
import type { SavedOfflineRegion } from "../../lib/savedRegions";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function OfflineOverlay() {
  const { deactivateTool } = useMap();
  const {
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
  } = useOffline();
  const [manageOpen, setManageOpen] = useState(false);

  const estimatedBytes = tileCount * 30 * 1024;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 6,
        }}
      >
        <div
          style={{
            ...dim,
            top: 0,
            left: 0,
            right: 0,
            height: `${DOWNLOAD_BOX_INSETS.top * 100}%`,
          }}
        />
        <div
          style={{
            ...dim,
            bottom: 0,
            left: 0,
            right: 0,
            height: `${DOWNLOAD_BOX_INSETS.bottom * 100}%`,
          }}
        />
        <div
          style={{
            ...dim,
            top: `${DOWNLOAD_BOX_INSETS.top * 100}%`,
            bottom: `${DOWNLOAD_BOX_INSETS.bottom * 100}%`,
            left: 0,
            width: `${DOWNLOAD_BOX_INSETS.horizontal * 100}%`,
          }}
        />
        <div
          style={{
            ...dim,
            top: `${DOWNLOAD_BOX_INSETS.top * 100}%`,
            bottom: `${DOWNLOAD_BOX_INSETS.bottom * 100}%`,
            right: 0,
            width: `${DOWNLOAD_BOX_INSETS.horizontal * 100}%`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: `${DOWNLOAD_BOX_INSETS.top * 100}%`,
            bottom: `${DOWNLOAD_BOX_INSETS.bottom * 100}%`,
            left: `${DOWNLOAD_BOX_INSETS.horizontal * 100}%`,
            right: `${DOWNLOAD_BOX_INSETS.horizontal * 100}%`,
            border: "2px dashed #f97316",
            borderRadius: 4,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 36,
          background: "rgba(17, 24, 39, 0.94)",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>
              Offline maps
            </div>
            <div
              style={{
                color: "#9ca3af",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              Pan to position the area inside the dashed box.
            </div>
          </div>
          <button
            onClick={deactivateTool}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={20} color="#fff" />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
              Offline mode
            </div>
            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
              Use only downloaded maps. No network requests.
            </div>
          </div>
          <ToggleSwitch
            checked={offlineMode}
            onChange={(v) => setOfflineMode(v)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#d1d5db", fontSize: 12 }}>
            {tileCount.toLocaleString()} tiles · ~{formatBytes(estimatedBytes)}
          </span>
          <span style={{ color: "#d1d5db", fontSize: 12 }}>
            Stored: {formatBytes(storageBytes)}
          </span>
        </div>

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
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8 }}>
          {downloading ? (
            <button
              onClick={cancelDownload}
              style={{ ...button, background: "#374151" }}
            >
              <Icon name="stop" size={18} color="#fff" />
              <span>Stop</span>
            </button>
          ) : (
            <>
              <button
                disabled={tileCount === 0}
                onClick={startDownload}
                style={{
                  ...button,
                  background: "#f97316",
                  opacity: tileCount === 0 ? 0.4 : 1,
                }}
              >
                <Icon name="download" size={18} color="#fff" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setManageOpen(true)}
                style={{ ...button, background: "#374151" }}
              >
                <Icon name="menu" size={18} color="#fff" />
                <span>Manage ({savedRegions.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {manageOpen ? (
        <ManageDownloadsPanel
          regions={savedRegions}
          regionSizes={regionSizes}
          onClose={() => setManageOpen(false)}
          onRemove={removeSavedRegion}
        />
      ) : null}
    </>
  );
}

function ManageDownloadsPanel({
  regions,
  regionSizes,
  onClose,
  onRemove,
}: {
  regions: SavedOfflineRegion[];
  regionSizes: Record<string, number>;
  onClose: () => void;
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

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 30,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxHeight: "70%",
          background: "#111827",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{ flex: 1, color: "#fff", fontSize: 16, fontWeight: 800 }}
          >
            Downloads
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={20} color="#fff" />
          </button>
        </div>

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
          {regions.length === 0 ? (
            <div
              style={{ color: "#9ca3af", fontSize: 14, padding: "16px 4px" }}
            >
              No downloads yet.
            </div>
          ) : (
            regions.map((region) => {
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
                  <RegionPreview
                    bounds={region.bounds}
                    width={140}
                    height={140}
                  />
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
                        ? formatBytes(regionSizes[region.id])
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
                    <Icon name="trash" size={16} color="#fff" />
                    <span>Remove</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

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

const dim: React.CSSProperties = {
  position: "absolute",
  background: "rgba(0, 0, 0, 0.45)",
};

const button: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 14px",
  borderRadius: 12,
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
};
