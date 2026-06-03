import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { LatLng } from "../lib/types";

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
  const latRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 100,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          color: "#111827",
          borderRadius: 16,
          padding: 20,
          maxWidth: 360,
          width: "100%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          Go to coordinate
        </h2>

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
          <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>
        ) : null}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#e5e7eb",
              color: "#111827",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
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
    </div>
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
      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
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
          borderRadius: 10,
          border: "1px solid #d1d5db",
          fontSize: 14,
          fontFamily: "monospace",
        }}
      />
    </label>
  );
}
