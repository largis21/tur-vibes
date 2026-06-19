import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { LatLng } from "../lib/types";
import { ModalShell } from "./ui/ModalShell";
import { useGeoLocation } from "../state/geoLocation/useGeoLocation";

/**
 * Parse one or two coordinate inputs into a LatLng. Accepts either a single
 * "lat, lon" string in `a` (with `b` empty) or separate values.
 */
function parseCoords(a: string, b: string): LatLng | null {
  const trimmed = a.trim();
  if (trimmed && !b.trim()) {
    const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
    if (parts.length === 2) return parseCoords(parts[0]!, parts[1]!);
    return null;
  }
  const lat = Number(a.replace(",", "."));
  const lon = Number(b.replace(",", "."));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;
  return { latitude: lat, longitude: lon };
}

export function GotoModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: LatLng;
  onClose: () => void;
  onSubmit: (coord: LatLng) => void;
}) {
  const [lat, setLat] = useState(initial.latitude.toFixed(5));
  const [lon, setLon] = useState(initial.longitude.toFixed(5));
  const [error, setError] = useState<string | null>(null);
  const [copiedButton, setCopiedButton] = useState<string | null>(null);
  const latRef = useRef<HTMLInputElement | null>(null);
  const userPosition = useGeoLocation((state) => state.userPosition);

  useEffect(() => {
    latRef.current?.focus();
    latRef.current?.select();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const coord = parseCoords(lat, lon);
    if (!coord) {
      setError("Enter valid latitude (-90..90) and longitude (-180..180).");
      return;
    }
    onSubmit(coord);
  }

  function handleCopy() {
    navigator.clipboard.writeText(`${lat}, ${lon}`);
    setCopiedButton("cursor");
    setTimeout(() => setCopiedButton(null), 2000);
  }

  function handleCopyUserLocation() {
    if (!userPosition) return;
    const coords = `${userPosition.latitude.toFixed(5)}, ${userPosition.longitude.toFixed(5)}`;
    navigator.clipboard.writeText(coords);
    setCopiedButton("user");
    setTimeout(() => setCopiedButton(null), 2000);
  }

  return (
    <ModalShell
      title="Go to coordinate"
      onClose={onClose}
      backdrop
      zIndex={100}
      position="top"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <Field
          label="Latitude"
          inputRef={latRef}
          value={lat}
          onChange={setLat}
          placeholder="60.39130"
          inputMode="decimal"
        />
        <Field
          label="Longitude"
          value={lon}
          onChange={setLon}
          placeholder="5.32210"
          inputMode="decimal"
        />

        {error ? (
          <div style={{ color: "#fca5a5", fontSize: 13 }}>{error}</div>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleCopy}
              title={
                copiedButton === "cursor" ? "Copied!" : "Copy cursor location"
              }
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background:
                  copiedButton === "cursor"
                    ? "rgba(34, 197, 94, 0.3)"
                    : "rgba(255,255,255,0.12)",
                color: copiedButton === "cursor" ? "#86efac" : "#d1d5db",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {copiedButton === "cursor" ? "✓ Copied" : "Copy cursor"}
            </button>
            <button
              type="button"
              onClick={handleCopyUserLocation}
              disabled={!userPosition}
              title={
                !userPosition
                  ? "User location not available"
                  : copiedButton === "user"
                    ? "Copied!"
                    : "Copy user location"
              }
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background:
                  copiedButton === "user"
                    ? "rgba(34, 197, 94, 0.3)"
                    : "rgba(255,255,255,0.12)",
                color: copiedButton === "user" ? "#86efac" : "#d1d5db",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s",
                opacity: userPosition ? 1 : 0.5,
                cursor: userPosition ? "pointer" : "not-allowed",
              }}
            >
              {copiedButton === "user" ? "✓ Copied" : "Copy user"}
            </button>
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#1d4ed8",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Go
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "text";
  inputRef?: MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>
        {label}
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.08)",
          color: "#f3f4f6",
          fontSize: 14,
          fontFamily: "monospace",
        }}
      />
    </label>
  );
}
