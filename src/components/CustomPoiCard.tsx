import { useState } from "react";
import type React from "react";
import { PiX, PiTrash } from "react-icons/pi";
import { usePoi, type CustomPoi } from "../tools/poi/context";
import { POI_TYPES } from "../lib/poiEmoji";

export function CustomPoiCard() {
  const {
    pois,
    selectedPoiId,
    selectPoi,
    renamePoi,
    removePoi,
    changePoiType,
    changePoiColor,
  } = usePoi();
  const poi = pois.find((p) => p.id === selectedPoiId) ?? null;

  if (!poi) return null;

  return (
    <PoiCard
      poi={poi}
      onRename={(name) => renamePoi(poi.id, name)}
      onChangeType={(t) => changePoiType(poi.id, t)}
      onChangeColor={(c) => changePoiColor(poi.id, c)}
      onDelete={() => removePoi(poi.id)}
      onClose={() => selectPoi(null)}
    />
  );
}

function PoiCard({
  poi,
  onRename,
  onChangeType,
  onChangeColor,
  onDelete,
  onClose,
}: {
  poi: CustomPoi;
  onRename: (name: string) => void;
  onChangeType: (type: string | null) => void;
  onChangeColor: (color: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(poi.name);
  const [pickingType, setPickingType] = useState(false);
  const [pickingColor, setPickingColor] = useState(false);

  const poiColor = poi.color ?? "#3b82f6";

  const COLORS: { hex: string; label: string }[] = [
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

  function handleSubmit() {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    else setDraft(poi.name);
    setEditing(false);
  }

  const pickerBtn = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.08)",
    border: active
      ? "1px solid rgba(59,130,246,0.7)"
      : "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: "5px 0",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 36,
        background: "rgba(17,24,39,0.96)",
        borderRadius: "16px 16px 24px 24px",
        padding: 16,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        color: "#fff",
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, marginTop: 2 }}>
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") {
                  setDraft(poi.name);
                  setEditing(false);
                }
              }}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                padding: "4px 8px",
                width: "100%",
                outline: "none",
              }}
            />
          ) : (
            <button
              onClick={() => {
                setDraft(poi.name);
                setEditing(true);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                textAlign: "left",
                cursor: "text",
                padding: 0,
                width: "100%",
              }}
            >
              {poi.name}
            </button>
          )}
          <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>
            {poi.locationType ? `${poi.locationType} · ` : ""}
            {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
            {poi.elevation != null ? ` · ${poi.elevation.toFixed(0)} m` : ""}
          </div>
        </div>
        <button
          aria-label="Close"
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 8,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <PiX
            size={18}
            color="#fff"
            style={{ display: "block", flexShrink: 0 }}
          />
        </button>
      </div>

      {/* Picker toggle buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={() => {
            setPickingType((v) => !v);
            setPickingColor(false);
          }}
          style={{
            background: pickingType
              ? "rgba(59,130,246,0.25)"
              : "rgba(255,255,255,0.08)",
            border: pickingType
              ? "1px solid rgba(59,130,246,0.6)"
              : "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 18 }}>
            {POI_TYPES.find((t) => t.type === poi.locationType)?.emoji ?? "📍"}
          </span>
          <span style={{ color: "#9ca3af" }}>
            {poi.locationType ?? "Default"}
          </span>
        </button>
        <button
          onClick={() => {
            setPickingColor((v) => !v);
            setPickingType(false);
          }}
          style={{
            background: pickingColor
              ? "rgba(59,130,246,0.25)"
              : "rgba(255,255,255,0.08)",
            border: pickingColor
              ? "1px solid rgba(59,130,246,0.6)"
              : "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: poiColor,
              border: "1px solid rgba(255,255,255,0.25)",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "#9ca3af" }}>Color</span>
        </button>
      </div>

      {pickingType && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 4,
          }}
        >
          <button
            onClick={() => {
              onChangeType(null);
              setPickingType(false);
            }}
            style={pickerBtn(poi.locationType === null)}
          >
            <span style={{ fontSize: 16 }}>📍</span>
            <span style={{ fontSize: 8, color: "#9ca3af" }}>Default</span>
          </button>
          {POI_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => {
                onChangeType(t.type);
                setPickingType(false);
              }}
              style={pickerBtn(poi.locationType === t.type)}
            >
              <span style={{ fontSize: 16 }}>{t.emoji}</span>
              <span style={{ fontSize: 8, color: "#9ca3af" }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {pickingColor && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 4,
          }}
        >
          {COLORS.map((c) => (
            <button
              key={c.hex}
              aria-label={c.label}
              onClick={() => {
                onChangeColor(c.hex);
                setPickingColor(false);
              }}
              style={pickerBtn(poiColor === c.hex)}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: c.hex,
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "block",
                }}
              />
              <span style={{ fontSize: 8, color: "#9ca3af" }}>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onDelete}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 10,
          color: "#f87171",
          fontSize: 14,
          fontWeight: 600,
          padding: "10px 14px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <PiTrash
          size={16}
          color="#f87171"
          style={{ display: "block", flexShrink: 0 }}
        />
        Delete POI
      </button>
    </div>
  );
}
