import { useState } from "react";
import { PiCloudArrowDown, PiPlus, PiTrash } from "react-icons/pi";
import { ModalShell } from "../../components/ui/ModalShell";
import { RegionPreview } from "../../components/RegionPreview";
import type { SavedOfflineRegion } from "../../lib/savedRegions";
import { ToggleSwitch, formatBytes, primaryButton } from "./OfflineShared";
import { useNetworkConnection } from "../../lib/useNetworkConnection";

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
  const isOnline = useNetworkConnection();

  return (
    <ModalShell
      title="Offline maps"
      subtitle={`Stored: ${formatBytes(storageBytes)}`}
      onClose={onClose}
      scrollable
      zIndex={20}
    >
      {isOnline && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-white text-sm font-bold">Offline mode</div>
            <div className="text-gray-400 text-xs mt-0.5">
              Use only downloaded maps. No network requests.
            </div>
          </div>
          <ToggleSwitch checked={offlineMode} onChange={setOfflineMode} />
        </div>
      )}

      {/* In-progress download banner */}
      {downloading && progress ? (
        <div className="bg-accent/15 border border-accent/40 rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <PiCloudArrowDown size={16} className="text-accent flex-shrink-0" />
            <span className="text-accent text-xs font-bold flex-1">
              Downloading…{" "}
              {progress.total
                ? `${Math.round(((progress.completed + progress.failed) / progress.total) * 100)}%`
                : ""}
            </span>
            <button
              onClick={onResumeCreate}
              className="text-gray-300 text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              View
            </button>
            <button
              onClick={onCancelDownload}
              aria-label="Cancel download"
              className="text-gray-400 text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="bg-white/12 rounded h-1 overflow-hidden">
            <div
              className="bg-accent h-full transition-all duration-100"
              style={{
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
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="text-gray-300 text-xs font-bold uppercase tracking-wider mt-1">
        Saved areas
      </div>

      <SavedRegionsList
        regions={savedRegions}
        regionSizes={regionSizes}
        onRemove={onRemoveRegion}
      />

      <button onClick={onNewRegion} className={primaryButton}>
        <PiPlus size={18} className="flex-shrink-0" />
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
      <div className="text-gray-400 text-sm py-3 px-1">
        No saved areas yet. Tap "New area" to download one.
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-3 overflow-x-auto overflow-y-hidden pb-1 overscroll-contain">
      {regions.map((region) => {
        const isRemoving = removingId === region.id;
        return (
          <div
            key={region.id}
            className="flex flex-col gap-2 p-2.5 bg-white/6 rounded-lg flex-shrink-0 w-40"
          >
            <RegionPreview polygon={region.polygon} width={140} height={140} />
            <div className="min-w-0">
              <div className="text-white text-sm font-bold truncate">
                {new Date(region.createdAt).toLocaleDateString()}
              </div>
              <div className="text-gray-400 text-xs mt-0.5 truncate">
                {regionSizes[region.id] != null
                  ? formatBytes(regionSizes[region.id]!)
                  : "…"}
              </div>
            </div>
            <button
              disabled={isRemoving}
              onClick={() => handleRemove(region.id)}
              aria-label="Remove download"
              className={`flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all ${
                isRemoving ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <PiTrash size={16} className="flex-shrink-0" />
              <span>Remove</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
