import { useState } from "react";
import { usePointInfo } from "../lib/PointInfoContext";
import { usePoi } from "../tools/poi/context";
import { ModalShell } from "./ui/ModalShell";
import { TerrainViewModalContent } from "./TerrainViewModal";
import { PiMapPin, PiMountains, PiArrowLeft } from "react-icons/pi";

function formatCoord(value: number) {
  return value.toFixed(5);
}

function compassFromBearing(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8]!;
}

export function PointInfoModal() {
  const {
    point,
    info,
    placeName,
    loading,
    error,
    close,
    toggleAspectArrow,
    showAspectArrow,
  } = usePointInfo();
  const { addPoi } = usePoi();
  const [saving, setSaving] = useState(false);
  const [showTerrainView, setShowTerrainView] = useState(false);

  if (!point) return null;

  function handleClose() {
    setShowTerrainView(false);
    close();
  }

  async function handleSaveAsPoi() {
    if (!point) return;
    setSaving(true);
    await addPoi({
      lat: point.latitude,
      lng: point.longitude,
      color: "#3b82f6",
      locationType: null,
      elevation: info?.elevation ?? null,
    });
    setSaving(false);
    // addPoi already calls setSelectedPoiId so CustomPoiCard opens automatically
    close();
  }

  return (
    <ModalShell
      title={showTerrainView ? "Terrain View" : "Point info"}
      subtitle={
        showTerrainView
          ? `${point.latitude.toFixed(4)}°N, ${point.longitude.toFixed(4)}°E`
          : placeName
      }
      onClose={handleClose}
    >
      {showTerrainView ? (
        <>
          <TerrainViewModalContent point={point} />
          <button
            onClick={() => setShowTerrainView(false)}
            className="flex items-center justify-center gap-2 w-full mt-3 px-3.5 py-2.75 rounded-lg bg-gray-600/15 border border-gray-600/40 text-gray-300 text-sm font-semibold hover:bg-gray-600/25 transition-colors"
          >
            <PiArrowLeft size={16} className="flex-shrink-0" />
            Back
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Coordinates"
              value={`${formatCoord(point.latitude)}, ${formatCoord(point.longitude)}`}
            />
            <Stat
              label="Elevation"
              value={
                loading
                  ? "…"
                  : info?.elevation != null
                    ? `${info.elevation.toFixed(0)} m`
                    : "–"
              }
            />
            <Stat
              label="Slope"
              value={
                loading
                  ? "…"
                  : info?.slopeDeg != null
                    ? `${info.slopeDeg.toFixed(1)}°`
                    : "–"
              }
            />
            <Stat
              label="Aspect"
              value={
                loading
                  ? "…"
                  : info?.aspectDeg != null
                    ? `${compassFromBearing(info.aspectDeg)} (${Math.round(info.aspectDeg)}°)`
                    : "–"
              }
              onClick={toggleAspectArrow}
              isClickable={info?.aspectDeg != null && !loading}
              isActive={showAspectArrow}
            />
          </div>

          {error ? (
            <div className="text-xs text-red-300 bg-red-900/15 rounded px-2 py-1.5">
              {error} — elevation requires an internet connection.
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={() => setShowTerrainView(true)}
              className="flex items-center justify-center gap-2 flex-1 px-3.5 py-2.75 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-300 text-sm font-semibold hover:bg-purple-500/25 transition-colors"
            >
              <PiMountains size={16} className="flex-shrink-0" />
              View from here
            </button>

            <button
              onClick={handleSaveAsPoi}
              disabled={saving}
              className={`flex items-center justify-center gap-2 flex-1 px-3.5 py-2.75 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-300 text-sm font-semibold hover:bg-blue-500/25 transition-colors ${
                saving ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <PiMapPin size={16} className="flex-shrink-0" />
              {saving ? "Saving…" : "Save as POI"}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

function Stat({
  label,
  value,
  onClick,
  isClickable,
  isActive,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  isClickable?: boolean;
  isActive?: boolean;
}) {
  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`transition-colors ${
        isClickable
          ? `cursor-pointer px-2.5 py-2 rounded-lg ${
              isActive ? "bg-blue-600/25" : "bg-blue-600/8 hover:bg-blue-600/15"
            }`
          : ""
      }`}
    >
      <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">
        {label}
      </div>
      <div className="font-mono text-base font-bold mt-0.5">{value}</div>
    </div>
  );
}
