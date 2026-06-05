import { useMap } from "../../lib/MapContext";
import { PiTrash, PiCrosshair, PiPlus, PiCompass } from "react-icons/pi";
import { HeaderShell } from "../../components/ui/HeaderShell";
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
          className="absolute inset-0 bg-black/52 z-18 cursor-crosshair"
          style={{ cursor: deviceHeading !== null ? "crosshair" : "default" }}
        >
          {/* Instruction text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none">
            {deviceHeading !== null ? (
              <>
                <div
                  className="text-white text-sm font-bold text-center max-w-xs leading-relaxed shadow-md"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
                >
                  Use the side of your phone to aim at a point in the distance,
                  then tap anywhere on the screen to mark the bearing.
                </div>
                <div className="bg-orange-500/90 text-white text-2xl font-black px-5 py-2 rounded-xl tracking-wide shadow-lg">
                  {Math.round(deviceHeading)}°
                </div>
              </>
            ) : (
              <div
                className="text-gray-300 text-sm font-semibold text-center max-w-xs leading-relaxed shadow-md"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
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
          <div className="flex gap-1.5 flex-1 flex-wrap">
            {SUB_TOOLS.map((t) => {
              const active = subToolId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSubToolId(t.id)}
                  className={`px-3 py-2 rounded-2xl text-white text-xs font-bold ${
                    active ? "bg-orange-500" : "bg-white/12"
                  }`}
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
            className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center"
            style={{ opacity: bearings.length === 0 ? 0.35 : 1 }}
          >
            <PiTrash size={18} color="#fff" className="block flex-shrink-0" />
          </button>
        </HeaderShell>
      )}

      {/* Bottom info row for the selected bearing. */}
      {subToolId === "bearing" && selected ? (
        <div className="absolute left-4 right-22 bottom-9 bg-dark-900/90 rounded-3.5 p-3.5 flex items-center gap-3 z-20">
          <div className="flex-1">
            <div className="text-gray-400 text-2xs font-bold uppercase tracking-wider">
              Bearing
            </div>
            <div className="text-white font-mono text-sm font-bold mt-0.5">
              {Math.round(selected.heading)}°
            </div>
          </div>
          <button
            aria-label="Remove bearing"
            onClick={() => removeBearing(selected.id)}
            className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center"
          >
            <PiTrash size={18} color="#fff" className="block flex-shrink-0" />
          </button>
        </div>
      ) : null}

      {/* FAB stack: locate + tracking compass + add bearing. */}
      {subToolId === "bearing" ? (
        <div className="absolute right-5 bottom-9 flex flex-col items-center gap-2.5 z-20">
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
            className="w-13 h-13 rounded-2xl bg-dark-900/85 text-white flex items-center justify-center shadow-lg border-2 border-transparent"
          >
            <PiCrosshair
              size={24}
              color="#9ca3af"
              className="block flex-shrink-0"
            />
          </button>
          {/* Compass tracking toggle */}
          <button
            aria-label={tracking ? "Disable tracking" : "Enable tracking"}
            onClick={() => setTracking(!tracking)}
            className={`w-13 h-13 rounded-2xl text-white flex items-center justify-center shadow-lg border-2 ${
              tracking
                ? "bg-blue-500 border-blue-400"
                : "bg-dark-900/85 border-transparent"
            }`}
          >
            <PiCompass
              size={26}
              color={tracking ? "#60a5fa" : "#9ca3af"}
              className="block flex-shrink-0"
            />
          </button>
          {/* Add bearing */}
          <button
            aria-label="Place bearing"
            onClick={addBearing}
            className="w-13 h-13 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg"
          >
            <PiPlus size={32} color="#fff" className="block flex-shrink-0" />
          </button>
        </div>
      ) : null}
    </>
  );
}
