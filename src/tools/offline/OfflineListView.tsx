import { useState } from "react";
import { PiCloudArrowDown, PiPlus, PiTrash } from "react-icons/pi";
import { ModalShell } from "../../components/ModalShell";
import { RegionPreview } from "../../components/RegionPreview";
import type { SavedOfflineRegion } from "../../lib/savedRegions";
import { ToggleSwitch, formatBytes, primaryButton } from "./OfflineShared";

export function ListView({
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
  const toggleRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    justifyContent: "space-between",
  };

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
