import { useMap } from "../../lib/MapContext";
import { useActiveTool } from "../../lib/ActiveToolContext";
import { PiTrash, PiCrosshair, PiPlus } from "react-icons/pi";
import { HeaderShell } from "../../components/ui/HeaderShell";
import { BearingCompass } from "./BearingCompass";
import { BearingLabel } from "./BearingLabel";
import { useBearing } from "./context";

export function BearingOverlay() {
  const { deactivateTool } = useActiveTool();
  const { mapRef } = useMap();
  const {
    bearings,
    selectedBearingId,
    selectBearing,
    addBearing,
    removeBearing,
    setBearingHeading,
    clearBearings,
  } = useBearing();

  const selected = bearings.find((b) => b.id === selectedBearingId) ?? null;

  function handleClose() {
    deactivateTool();
  }

  return (
    <>
      {/* Compass widgets are rendered above the map for each bearing. */}
      {bearings.map((b) => (
        <BearingCompass
          key={b.id}
          bearing={b}
          selected={b.id === selectedBearingId}
          onSelect={() => selectBearing(b.id)}
          onChangeHeading={(h) => setBearingHeading(b.id, h)}
        />
      ))}

      {/* Direction labels for each committed bearing. */}
      {bearings.map((b) => (
        <BearingLabel key={b.id} bearing={b} />
      ))}

      {/* Top bar: close button. */}
      <HeaderShell
        onClose={handleClose}
        ariaLabel="Bearing tool"
        title="Bearing"
        subtitle="Create and manage bearings"
      >
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

      {/* Bottom info row for the selected bearing. */}
      {selected ? (
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
            zIndex: 35,
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
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 36,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          zIndex: 35,
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
    </>
  );
}
