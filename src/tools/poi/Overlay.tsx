import { useState } from "react";
import {
  PiGear,
  PiSortAscending,
  PiTrash,
  PiPlus,
  PiFunnel,
} from "react-icons/pi";
import { HeaderShell } from "../../components/ui/HeaderShell";
import { FabButton } from "../../components/FabButton";
import { useMap } from "../../lib/MapContext";
import { useActiveTool } from "../../lib/ActiveToolContext";
import { usePoi } from "./context";
import { typeEmoji } from "../../lib/poiEmoji";

const FILTER_COLORS: { hex: string; label: string }[] = [
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#ef4444", label: "Red" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#eab308", label: "Yellow" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#14b8a6", label: "Teal" },
  { hex: "#8b5cf6", label: "Purple" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#ffffff", label: "White" },
];

/** Calculate distance in km between two lat/lon points using Haversine formula. */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function PoiOverlay() {
  const { deactivateTool } = useActiveTool();
  const { cursorCoordinate, mapRef } = useMap();
  const {
    pois,
    addPoi,
    selectPoi,
    removePoi,
    poiFilter,
    setPoiFilter,
    filterPanelOpen,
    setFilterPanelOpen,
  } = usePoi();
  const [managePanelOpen, setManagePanelOpen] = useState(false);
  const [sortMode, setSortMode] = useState<
    "name" | "type" | "date" | "distance"
  >("date");

  function handleClose() {
    selectPoi(null);
    deactivateTool();
  }

  function handleAdd() {
    const { latitude, longitude } = cursorCoordinate.current;
    void addPoi({
      lat: latitude,
      lng: longitude,
      color: "#3b82f6",
      locationType: null,
      elevation: null,
    });
  }

  const isFiltered = poiFilter.types.length > 0 || poiFilter.colors.length > 0;

  function toggleType(type: string) {
    setPoiFilter({
      ...poiFilter,
      types: poiFilter.types.includes(type)
        ? poiFilter.types.filter((t) => t !== type)
        : [...poiFilter.types, type],
    });
  }

  function toggleColor(hex: string) {
    setPoiFilter({
      ...poiFilter,
      colors: poiFilter.colors.includes(hex)
        ? poiFilter.colors.filter((c) => c !== hex)
        : [...poiFilter.colors, hex],
    });
  }

  function clearFilter() {
    setPoiFilter({ types: [], colors: [] });
    setFilterPanelOpen(false);
  }

  function openFilter() {
    setManagePanelOpen(false);
    setFilterPanelOpen(!filterPanelOpen);
  }

  function openManage() {
    setFilterPanelOpen(false);
    setManagePanelOpen((v) => !v);
  }

  function cycleSort() {
    setSortMode((m) =>
      m === "date"
        ? "name"
        : m === "name"
          ? "type"
          : m === "type"
            ? "distance"
            : "date",
    );
  }

  function panTo(lat: number, lng: number) {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: Math.max(mapRef.current.getZoom(), 14),
      duration: 600,
    });
  }

  // Collect types and colors that actually exist in the POI list
  const usedTypes = [...new Set(pois.map((p) => p.locationType ?? ""))];
  const usedColors = [...new Set(pois.map((p) => p.color ?? "#3b82f6"))];

  // Filtered + sorted POI list for manage panel
  const filteredPois = pois
    .filter((p) => {
      if (
        poiFilter.types.length > 0 &&
        !poiFilter.types.includes(p.locationType ?? "")
      )
        return false;
      if (
        poiFilter.colors.length > 0 &&
        !poiFilter.colors.includes(p.color ?? "#3b82f6")
      )
        return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "type")
        return (a.locationType ?? "").localeCompare(b.locationType ?? "");
      if (sortMode === "distance") {
        const center = mapRef.current?.getCenter();
        if (!center) return 0;
        const distA = haversineKm(center.lat, center.lng, a.lat, a.lng);
        const distB = haversineKm(center.lat, center.lng, b.lat, b.lng);
        return distA - distB; // closest first
      }
      return b.createdAt - a.createdAt; // date: newest first
    });

  return (
    <>
      <HeaderShell onClose={handleClose} ariaLabel="POI tool">
        {/* Cog — manage list */}
        <button
          aria-label="Manage POIs"
          onClick={openManage}
          style={{
            background: managePanelOpen
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.15)",
            border: managePanelOpen
              ? "1px solid rgba(255,255,255,0.3)"
              : "none",
            borderRadius: 10,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <PiGear
            size={20}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
        </button>

        {/* Filter */}
        <button
          aria-label="Filter POIs"
          onClick={openFilter}
          style={{
            background: isFiltered
              ? "rgba(59,130,246,0.35)"
              : filterPanelOpen
                ? "rgba(255,255,255,0.2)"
                : "rgba(255,255,255,0.15)",
            border: isFiltered ? "1px solid rgba(59,130,246,0.7)" : "none",
            borderRadius: 10,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <PiFunnel
            size={20}
            color={isFiltered ? "#60a5fa" : "#fff"}
            style={{ display: "block", flexShrink: 0 }}
          />
          {isFiltered && (
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#3b82f6",
                border: "1.5px solid rgba(17,24,39,0.96)",
              }}
            />
          )}
        </button>

        {/* Sort */}
        <button
          aria-label={`Sort by ${sortMode}`}
          onClick={cycleSort}
          style={{
            display: managePanelOpen ? "flex" : "none",
            background:
              sortMode !== "date"
                ? "rgba(255,255,255,0.2)"
                : "rgba(255,255,255,0.15)",
            border:
              sortMode !== "date" ? "1px solid rgba(255,255,255,0.3)" : "none",
            borderRadius: 10,
            width: 44,
            height: 44,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            gap: 1,
          }}
        >
          <PiSortAscending
            size={20}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 7,
              color: "#9ca3af",
              lineHeight: 1,
              letterSpacing: 0.3,
            }}
          >
            {sortMode === "distance" ? "DIST" : sortMode.toUpperCase()}
          </span>
        </button>

        <div style={{ flex: 1 }} />
      </HeaderShell>

      {managePanelOpen && (
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 16,
            right: 16,
            maxHeight: "60vh",
            overflowY: "auto",
            background: "rgba(17,24,39,0.97)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            zIndex: 25,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {filteredPois.length === 0 ? (
            <p
              style={{ color: "#6b7280", fontSize: 13, margin: 0, padding: 16 }}
            >
              {pois.length === 0
                ? "No POIs yet."
                : "No POIs match the active filters."}
            </p>
          ) : (
            filteredPois.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderTop:
                    i > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                }}
              >
                {/* Tap row → pan to POI */}
                <button
                  onClick={() => panTo(p.lat, p.lng)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                    minWidth: 0,
                  }}
                >
                  {/* Icon + color dot */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <span style={{ fontSize: 26, lineHeight: 1 }}>
                      {typeEmoji(p.locationType)}
                    </span>
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: p.color ?? "#3b82f6",
                        border: "1.5px solid rgba(17,24,39,0.97)",
                      }}
                    />
                  </div>
                  {/* Text */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{ color: "#9ca3af", fontSize: 11, marginTop: 1 }}
                    >
                      {p.locationType ? `${p.locationType} · ` : ""}
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                      {p.elevation != null
                        ? ` · ${p.elevation.toFixed(0)} m`
                        : ""}
                    </div>
                  </div>
                </button>
                {/* Edit */}
                <button
                  aria-label="Edit"
                  onClick={() => {
                    selectPoi(p.id);
                    setManagePanelOpen(false);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "none",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <PiGear
                    size={15}
                    color="#9ca3af"
                    style={{ display: "block", flexShrink: 0 }}
                  />
                </button>
                {/* Delete */}
                <button
                  aria-label="Delete"
                  onClick={() => removePoi(p.id)}
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "none",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <PiTrash
                    size={15}
                    color="#f87171"
                    style={{ display: "block", flexShrink: 0 }}
                  />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {filterPanelOpen && (
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 16,
            right: 16,
            background: "rgba(17,24,39,0.97)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: 14,
            zIndex: 25,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Type filter */}
          {usedTypes.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#6b7280",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                TYPE
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {usedTypes.map((t) => {
                  const active = poiFilter.types.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      style={{
                        background: active
                          ? "rgba(59,130,246,0.35)"
                          : "rgba(255,255,255,0.08)",
                        border: active
                          ? "1px solid rgba(59,130,246,0.7)"
                          : "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        padding: "5px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        color: "#fff",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {t === "" ? "📍" : typeEmoji(t)}
                      </span>
                      <span>{t === "" ? "Default" : t}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color filter */}
          {usedColors.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#6b7280",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                COLOR
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {usedColors.map((hex) => {
                  const active = poiFilter.colors.includes(hex);
                  const label =
                    FILTER_COLORS.find((c) => c.hex === hex)?.label ?? hex;
                  return (
                    <button
                      key={hex}
                      onClick={() => toggleColor(hex)}
                      style={{
                        background: active
                          ? "rgba(59,130,246,0.35)"
                          : "rgba(255,255,255,0.08)",
                        border: active
                          ? "1px solid rgba(59,130,246,0.7)"
                          : "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        padding: "5px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#fff",
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: hex,
                          border: "1px solid rgba(255,255,255,0.25)",
                          flexShrink: 0,
                        }}
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isFiltered && (
            <button
              onClick={clearFilter}
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                fontSize: 12,
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
              }}
            >
              Clear filters
            </button>
          )}

          {usedTypes.length === 0 && usedColors.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
              No POIs to filter yet.
            </p>
          )}
        </div>
      )}

      <FabButton
        aria-label="Add POI at map centre"
        onClick={handleAdd}
        style={{
          position: "absolute",
          right: 20,
          bottom: 36,
          background: "#3b82f6",
          zIndex: 20,
        }}
      >
        <PiPlus
          size={24}
          color="#fff"
          style={{ display: "block", flexShrink: 0 }}
        />
      </FabButton>
    </>
  );
}
