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
        console.error(err);
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
    const kommune = r.kommuner?.[0]?.kommunenavn;
    const fylke = r.fylker?.[0]?.fylkesnavn;
    if (kommune) parts.push(kommune);
    else if (fylke) parts.push(fylke);
    return parts.join(" · ");
  }

  return (
    <div className="mb-6">
      <div className="flex items-center relative">
        <span className="absolute left-2.5 flex items-center text-gray-500 pointer-events-none">
          <PiMagnifyingGlass size={18} className="block" />
        </span>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-9 py-2.5 rounded-secondary border-1.5 border-gray-200 text-base bg-gray-50 text-dark-900 outline-none box-border"
        />
        {query && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-2 flex items-center text-gray-400 bg-none border-0 cursor-pointer p-0.5"
          >
            <PiX size={16} className="block" />
          </button>
        )}
      </div>

      <div className="mt-1.5 relative">
        {loading && (
          <p className="ml-1 text-xs text-gray-500 absolute">Searching…</p>
        )}

        {error && <p className="ml-1 text-xs text-red-600 absolute">{error}</p>}

        {!loading && !error && query.trim() && results.length === 0 && (
          <p className="ml-1 text-xs text-gray-500 absolute">
            No results found.
          </p>
        )}

        {results.length > 0 && (
          <ul className="list-none p-0 rounded-secondary border border-gray-200 max-h-50 overflow-y-auto bg-white absolute top-0 left-0 right-0 z-10">
            {results.map((r, i) => (
              <li key={r.stedsnummer}>
                <button
                  onClick={() => handleSelect(r)}
                  className="flex items-start gap-2 w-full px-3 py-2.5 bg-none border-0 text-left cursor-pointer text-xs text-dark-900 leading-relaxed"
                  style={{ borderTop: i === 0 ? "none" : "1px solid #f3f4f6" }}
                >
                  <span className="mt-0.5 text-gray-400 flex-shrink-0">
                    <PiMapPin size={14} className="block" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold">{r.skrivemåte}</span>
                    <span className="block text-gray-500 text-2xs">
                      {formatSubtitle(r)}
                    </span>
                  </span>
                  {r.distanceKm != null && (
                    <span className="text-2xs text-gray-400 flex-shrink-0 self-center ml-1">
                      {formatDistance(r.distanceKm)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
