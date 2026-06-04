import { useEffect, useRef, useState } from "react";
import { useMap } from "../lib/MapContext";
import { PiMagnifyingGlass, PiX, PiMapPin } from "react-icons/pi";

type StedResult = {
  stedsnummer: number;
  skrivemåte: string;
  navneobjekttype: string;
  kommuner: { kommunenavn: string }[];
  fylker: { fylkesnavn: string }[];
  representasjonspunkt: { nord: number; øst: number };
};

type StedResultWithDistance = StedResult & { distanceKm: number | null };

/** Haversine distance in km between two lat/lon points. */
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

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

type StedResponse = {
  navn: StedResult[];
};

const STEDSNAVN_URL = "https://ws.geonorge.no/stedsnavn/v1/navn";

export function LocationSearch({
  onSelectResult,
}: {
  onSelectResult?: () => void;
}) {
  const { mapRef } = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StedResultWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          sok: `${trimmed}*`,
          fuzzy: "true",
          utkoordsys: "4326",
          treffPerSide: "20",
          side: "1",
        });
        const res = await fetch(`${STEDSNAVN_URL}?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data: StedResponse = await res.json();

        const center = mapRef.current?.getCenter();
        const navn = data.navn ?? [];
        const withDist: StedResultWithDistance[] = navn.map((r) => ({
          ...r,
          distanceKm: center
            ? haversineKm(
                center.lat,
                center.lng,
                r.representasjonspunkt.nord,
                r.representasjonspunkt.øst,
              )
            : null,
        }));
        withDist.sort((a, b) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });
        setResults(withDist.slice(0, 8));
        setError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Search failed. Check your connection.");
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(result: StedResult) {
    const { nord: lat, øst: lon } = result.representasjonspunkt;
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({ center: [lon, lat], zoom: 13, duration: 600 });

    setQuery("");
    setResults([]);
    onSelectResult?.();
  }

  function formatSubtitle(r: StedResult): string {
    const parts: string[] = [r.navneobjekttype];
    const kommune = r.kommuner[0]?.kommunenavn;
    const fylke = r.fylker[0]?.fylkesnavn;
    if (kommune) parts.push(kommune);
    else if (fylke) parts.push(fylke);
    return parts.join(" · ");
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 10,
            display: "flex",
            alignItems: "center",
            color: "#6b7280",
            pointerEvents: "none",
          }}
        >
          <PiMagnifyingGlass size={18} style={{ display: "block" }} />
        </span>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 36px 10px 36px",
            borderRadius: 12,
            border: "1.5px solid #e5e7eb",
            fontSize: 15,
            background: "#f9fafb",
            color: "#111827",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {query && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            style={{
              position: "absolute",
              right: 8,
              display: "flex",
              alignItems: "center",
              color: "#9ca3af",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
            }}
          >
            <PiX size={16} style={{ display: "block" }} />
          </button>
        )}
      </div>

      {loading && (
        <p style={{ margin: "6px 0 0 4px", fontSize: 13, color: "#6b7280" }}>
          Searching…
        </p>
      )}

      {error && (
        <p style={{ margin: "6px 0 0 4px", fontSize: 13, color: "#dc2626" }}>
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: "6px 0 0",
            padding: 0,
            borderRadius: 12,
            border: "1.5px solid #e5e7eb",
            maxHeight: 200,
            overflowY: "auto",
            background: "#fff",
          }}
        >
          {results.map((r, i) => (
            <li key={r.stedsnummer}>
              <button
                onClick={() => handleSelect(r)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  width: "100%",
                  padding: "10px 12px",
                  background: "none",
                  border: "none",
                  borderTop: i === 0 ? "none" : "1px solid #f3f4f6",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#111827",
                  lineHeight: 1.35,
                }}
              >
                <span style={{ marginTop: 2, color: "#9ca3af", flexShrink: 0 }}>
                  <PiMapPin size={14} style={{ display: "block" }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 600 }}>
                    {r.skrivemåte}
                  </span>
                  <span
                    style={{ display: "block", color: "#6b7280", fontSize: 12 }}
                  >
                    {formatSubtitle(r)}
                  </span>
                </span>
                {r.distanceKm != null && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      flexShrink: 0,
                      alignSelf: "center",
                      marginLeft: 4,
                    }}
                  >
                    {formatDistance(r.distanceKm)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && query.trim() && results.length === 0 && (
        <p style={{ margin: "6px 0 0 4px", fontSize: 13, color: "#6b7280" }}>
          No results found.
        </p>
      )}
    </div>
  );
}
