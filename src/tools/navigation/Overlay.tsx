import { useMap } from "../../lib/MapContext";
import { PiTrash, PiCrosshair, PiPlus, PiCompass } from "react-icons/pi";
import { HeaderShell } from "../../components/HeaderShell";
import { BearingCompass } from "./BearingCompass";
import { BearingLabel } from "./BearingLabel";
import { useNavigation, type SubToolId } from "./context";

const SUB_TOOLS: { id: SubToolId; title: string }[] = [
  { id: "bearing", title: "Bearing" },
];

export function NavigationOverlay() {
  const { deactivateTool, mapRef } = useMap();
  const {
    subToolId,
    setSubToolId,
    bearings,
    selectedBearingId,
    selectBearing,
    addBearing,
    removeBearing,
    setBearingHeading,
    clearBearings,
    tracking,
    setTracking,
    deviceHeading,
    captureTrackingBearing,
  } = useNavigation();

  const selected = bearings.find((b) => b.id === selectedBearingId) ?? null;

  function handleClose() {
    deactivateTool();
  }

  return (
    <>
      {/* Compass widgets are rendered above the map for each bearing. */}
      {subToolId === "bearing" && !tracking
        ? bearings.map((b) => (
            <BearingCompass
              key={b.id}
              bearing={b}
              selected={b.id === selectedBearingId}
              onSelect={() => selectBearing(b.id)}
              onChangeHeading={(h) => setBearingHeading(b.id, h)}
            />
          ))
        : null}

      {/* Direction labels for each committed bearing. */}
      {subToolId === "bearing" && !tracking
        ? bearings.map((b) => <BearingLabel key={b.id} bearing={b} />)
        : null}

      {/* Tracking aim overlay — dims the map and guides the user to tap. */}
      {tracking && (
        <div
          onClick={deviceHeading !== null ? captureTrackingBearing : undefined}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.52)",
            zIndex: 18,
            cursor: deviceHeading !== null ? "crosshair" : "default",
          }}
        >
          {/* Instruction text */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              pointerEvents: "none",
            }}
          >
            {deviceHeading !== null ? (
              <>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    textAlign: "center",
                    maxWidth: 260,
                    lineHeight: 1.5,
                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  Use the side of your phone to aim at a point in the distance,
                  then tap anywhere on the screen to mark the bearing.
                </div>
                <div
                  style={{
                    background: "rgba(249, 115, 22, 0.9)",
                    color: "#fff",
                    fontSize: 22,
                    fontWeight: 800,
                    padding: "8px 20px",
                    borderRadius: 12,
                    letterSpacing: 0.5,
                    boxShadow: "0 3px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  {Math.round(deviceHeading)}°
                </div>
              </>
            ) : (
              <div
                style={{
                  color: "#d1d5db",
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "center",
                  maxWidth: 240,
                  lineHeight: 1.5,
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                Waiting for compass signal…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top bar: sub-tool chips + close. Hidden while tracking so the sights are unobstructed. */}
      {!tracking && (
        <HeaderShell onClose={handleClose} ariaLabel="Navigation tool">
          <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
            {SUB_TOOLS.map((t) => {
              const active = subToolId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSubToolId(t.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: active ? "#f97316" : "rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
          <button
            aria-label="Clear all bearings"
            disabled={bearings.length === 0}
            onClick={clearBearings}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: bearings.length === 0 ? 0.35 : 1,
            }}
          >
            <PiTrash
              size={18}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>
        </HeaderShell>
      )}

      {/* Bottom info row for the selected bearing. */}
      {subToolId === "bearing" && selected ? (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 88,
            bottom: 36,
            background: "rgba(17, 24, 39, 0.9)",
            borderRadius: 14,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "#9ca3af",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Bearing
            </div>
            <div
              style={{
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 14,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {Math.round(selected.heading)}°
            </div>
          </div>
          <button
            aria-label="Remove bearing"
            onClick={() => removeBearing(selected.id)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PiTrash
              size={18}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>
        </div>
      ) : null}

      {/* FAB stack: locate + tracking compass + add bearing. */}
      {subToolId === "bearing" ? (
        <div
          style={{
            position: "absolute",
            right: 20,
            bottom: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            zIndex: 20,
          }}
        >
          {/* Go to user position */}
          <button
            aria-label="Go to my position"
            onClick={() => {
              navigator.geolocation?.getCurrentPosition(
                (pos) => {
                  mapRef.current?.flyTo({
                    center: [pos.coords.longitude, pos.coords.latitude],
                    duration: 800,
                  });
                },
                undefined,
                { enableHighAccuracy: true, timeout: 8000 },
              );
            }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "rgba(17,24,39,0.85)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
              border: "2px solid transparent",
            }}
          >
            <PiCrosshair
              size={24}
              color="#9ca3af"
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>
          {/* Compass tracking toggle */}
          <button
            aria-label={tracking ? "Disable tracking" : "Enable tracking"}
            onClick={() => setTracking(!tracking)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: tracking ? "#3b82f6" : "rgba(17,24,39,0.85)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
              border: tracking ? "2px solid #60a5fa" : "2px solid transparent",
            }}
          >
            <PiCompass
              size={26}
              color={tracking ? "#60a5fa" : "#9ca3af"}
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>
          {/* Add bearing */}
          <button
            aria-label="Place bearing"
            onClick={addBearing}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "#f97316",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
            }}
          >
            <PiPlus
              size={32}
              color="#fff"
              style={{ display: "block", flexShrink: 0 }}
            />
          </button>
        </div>
      ) : null}
    </>
  );
}
