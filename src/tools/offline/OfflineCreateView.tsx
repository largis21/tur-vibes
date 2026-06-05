import {
  PiX,
  PiBackspace,
  PiTrash,
  PiPlus,
  PiStop,
  PiDownloadSimple,
} from "react-icons/pi";
import { formatBytes, iconButton, primaryButton } from "./OfflineShared";

export function CreateView({
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
      <div className="absolute top-4 left-4 right-4 bg-dark-900/94 rounded-2xl p-3 flex items-center gap-2 z-20">
        <button aria-label="Back" onClick={onBack} className={iconButton}>
          <PiX size={20} className="flex-shrink-0" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-white text-xs font-black uppercase tracking-wider">
            New offline area
          </div>
          <div
            className={`text-xs font-semibold mt-0.5 ${
              selfIntersecting ? "text-red-300" : "text-gray-300"
            }`}
          >
            {status}
          </div>
        </div>
        <button
          aria-label="Remove last point"
          disabled={polygon.length === 0 || downloading}
          onClick={onUndo}
          className={`${iconButton} ${
            polygon.length === 0 || downloading ? "opacity-35" : ""
          }`}
        >
          <PiBackspace size={20} className="flex-shrink-0" />
        </button>
        <button
          aria-label="Clear"
          disabled={polygon.length === 0 || downloading}
          onClick={onClear}
          className={`${iconButton} ${
            polygon.length === 0 || downloading ? "opacity-35" : ""
          }`}
        >
          <PiTrash size={18} className="flex-shrink-0" />
        </button>
      </div>

      {/* Add-point FAB at the crosshair */}
      {!downloading ? (
        <button
          aria-label="Add point"
          onClick={onAdd}
          className="absolute right-5 bottom-[132px] w-14 h-14 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg z-20 hover:bg-accent-light transition-colors"
        >
          <PiPlus size={32} className="flex-shrink-0" />
        </button>
      ) : null}

      {/* Bottom action bar */}
      <div className="absolute left-4 right-4 bottom-9 bg-dark-900/94 rounded-2xl p-3 flex flex-col gap-2.5 z-20">
        {progress && downloading ? (
          <div className="flex flex-col gap-1.5">
            <div className="bg-white/12 rounded h-1.5 overflow-hidden">
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
            <div className="text-gray-300 text-xs text-center">
              {progress.completed + progress.failed}/{progress.total}
              {progress.failed > 0 ? ` (${progress.failed} failed)` : ""}
            </div>
            <div className="text-gray-500 text-xs text-center italic">
              You can go back — the download continues in the background.
            </div>
          </div>
        ) : null}

        {downloading ? (
          <button
            onClick={onCancelDownload}
            className={`${primaryButton} bg-gray-600 hover:bg-gray-700`}
          >
            <PiStop size={18} className="flex-shrink-0" />
            <span>Stop download</span>
          </button>
        ) : (
          <button
            disabled={!canDownload}
            onClick={onDownload}
            className={`${primaryButton} ${
              !canDownload ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            <PiDownloadSimple size={18} className="flex-shrink-0" />
            <span>Download</span>
          </button>
        )}
      </div>
    </>
  );
}
