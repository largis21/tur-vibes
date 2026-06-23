import {
  PiX,
  PiBackspace,
  PiTrash,
  PiPlus,
  PiStop,
  PiDownloadSimple,
  PiPencilSimple,
} from "react-icons/pi";
import { formatBytes, iconButton, primaryButton } from "./OfflineShared";
import { basemaps, overlays } from "../../lib/mapSources";
import { useOffline, DEFAULT_MAX_ZOOM_BY_SOURCE, OFFLINE_MIN_ZOOM } from "./context";
import { useMemo } from "react";

export function CreateView({
  polygon,
  tileCount,
  selfIntersecting,
  downloading,
  progress,
  locked,
  onAdd,
  onUndo,
  onClear,
  onBack,
  onSetArea,
  onEditArea,
  onDownload,
  onCancelDownload,
}: {
  polygon: { latitude: number; longitude: number }[];
  tileCount: number;
  selfIntersecting: boolean;
  downloading: boolean;
  progress: { total: number; completed: number; failed: number } | null;
  locked: boolean;
  onAdd: () => void;
  onUndo: () => void;
  onClear: () => void;
  onBack: () => void;
  onSetArea: () => void;
  onEditArea: () => void;
  onDownload: () => void;
  onCancelDownload: () => void;
}) {
  const {
    selectedSourceIds,
    toggleSourceSelection,
    customMaxZoom,
    setMaxZoomForSource,
    applicableSourceIds,
  } = useOffline();

  const allBasemaps = basemaps();
  const allOverlays = overlays();

  const applicableBasemaps = useMemo(
    () => allBasemaps.filter((b) => applicableSourceIds.includes(b.id)),
    [applicableSourceIds],
  );

  const applicableOverlays = useMemo(
    () => allOverlays.filter((o) => applicableSourceIds.includes(o.id)),
    [applicableSourceIds],
  );

  const estimatedBytes = tileCount * 30 * 1024;
  const canSetArea = polygon.length >= 3 && !selfIntersecting;
  const canDownload = locked && tileCount > 0;
  const status = selfIntersecting
    ? "Invalid shape – the area's edges cross. Move points so the outline doesn't overlap itself."
    : polygon.length === 0
      ? "Pan and tap the map to add points."
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
        {!locked ? (
          <>
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
          </>
        ) : (
          <button
            aria-label="Edit area"
            disabled={downloading}
            onClick={onEditArea}
            className={`${iconButton} ${downloading ? "opacity-35" : ""}`}
          >
            <PiPencilSimple size={18} className="flex-shrink-0" />
          </button>
        )}
      </div>

      {/* Add-point FAB (drawing phase only) */}
      {!locked && !downloading ? (
        <button
          aria-label="Add point"
          onClick={onAdd}
          className="absolute right-5 bottom-[132px] w-14 h-14 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg z-20 hover:bg-accent-dark transition-colors"
        >
          <PiPlus size={28} className="flex-shrink-0" />
        </button>
      ) : null}

      {/* Bottom action bar */}
      <div className="absolute left-4 right-4 bottom-9 bg-dark-900/94 rounded-2xl p-3 flex flex-col gap-2.5 z-20 max-h-[60vh] overflow-y-auto">
        {locked &&
        !downloading &&
        applicableBasemaps.length + applicableOverlays.length > 0 ? (
          <div className="flex flex-col gap-2.5 text-xs">
            {/* Basemaps */}
            {applicableBasemaps.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-semibold text-gray-200">Base layers</div>
                  <div className="text-accent font-semibold">Max zoom</div>
                </div>
                {applicableBasemaps.map((source) => {
                  const sliderMax = source.offline.maxZoom;
                  const defaultMaxZoom =
                    DEFAULT_MAX_ZOOM_BY_SOURCE[
                      source.id as keyof typeof DEFAULT_MAX_ZOOM_BY_SOURCE
                    ] ?? sliderMax;
                  return (
                    <div
                      key={source.id}
                      className="py-1 px-2 flex flex-col gap-2.5"
                    >
                      <span className="text-gray-300">{source.label}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedSourceIds.includes(source.id)}
                            onChange={() => toggleSourceSelection(source.id)}
                            className="accent-accent w-5 h-5"
                          />
                        </label>
                        <div
                          className={`flex items-center gap-2 flex-1 min-w-0 transition-opacity ${selectedSourceIds.includes(source.id) ? "opacity-100" : "opacity-25 pointer-events-none"}`}
                        >
                          <input
                            type="range"
                            min={OFFLINE_MIN_ZOOM}
                            max={sliderMax}
                            value={customMaxZoom[source.id] ?? defaultMaxZoom}
                            disabled={!selectedSourceIds.includes(source.id)}
                            onChange={(e) =>
                              setMaxZoomForSource(
                                source.id,
                                parseInt(e.target.value),
                              )
                            }
                            className="flex-1 h-1"
                            style={{
                              accentColor: selectedSourceIds.includes(source.id)
                                ? "#f97316"
                                : "#6b7280",
                            }}
                          />
                          <span
                            className={`font-semibold flex-shrink-0 w-8 text-right ${selectedSourceIds.includes(source.id) ? "text-accent" : "text-gray-500"}`}
                          >
                            {customMaxZoom[source.id] ?? defaultMaxZoom}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Overlays */}
            {applicableOverlays.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-semibold text-gray-200">Overlays</div>
                </div>
                {applicableOverlays.map((source) => {
                  const sliderMax = source.offline.maxZoom;
                  const defaultMaxZoom =
                    DEFAULT_MAX_ZOOM_BY_SOURCE[
                      source.id as keyof typeof DEFAULT_MAX_ZOOM_BY_SOURCE
                    ] ?? sliderMax;
                  return (
                    <div
                      key={source.id}
                      className="py-1 px-2 flex flex-col gap-2.5"
                    >
                      <span className="text-gray-300">{source.label}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedSourceIds.includes(source.id)}
                            onChange={() => toggleSourceSelection(source.id)}
                            className="accent-accent w-5 h-5"
                          />
                        </label>
                        <div
                          className={`flex items-center gap-2 flex-1 min-w-0 transition-opacity ${selectedSourceIds.includes(source.id) ? "opacity-100" : "opacity-25 pointer-events-none"}`}
                        >
                          <input
                            type="range"
                            min={OFFLINE_MIN_ZOOM}
                            max={sliderMax}
                            value={customMaxZoom[source.id] ?? defaultMaxZoom}
                            disabled={!selectedSourceIds.includes(source.id)}
                            onChange={(e) =>
                              setMaxZoomForSource(
                                source.id,
                                parseInt(e.target.value),
                              )
                            }
                            className="flex-1 h-1"
                            style={{
                              accentColor: selectedSourceIds.includes(source.id)
                                ? "#f97316"
                                : "#6b7280",
                            }}
                          />
                          <span
                            className={`font-semibold flex-shrink-0 w-8 text-right ${selectedSourceIds.includes(source.id) ? "text-accent" : "text-gray-500"}`}
                          >
                            {customMaxZoom[source.id] ?? defaultMaxZoom}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

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
        ) : locked ? (
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
        ) : (
          <button
            disabled={!canSetArea}
            onClick={onSetArea}
            className={`${primaryButton} ${
              !canSetArea ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            <span>Set area</span>
          </button>
        )}
      </div>
    </>
  );
}
