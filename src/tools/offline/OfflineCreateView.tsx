import { PiX, PiBackspace, PiTrash, PiPlus, PiStop, PiDownloadSimple } from "react-icons/pi";
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
