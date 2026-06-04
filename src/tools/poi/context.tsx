import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { fetchNearestPlaceName, fetchElevations } from "../../lib/elevation";
import { safeGetItem, safeSetItem } from "../../lib/storage";

const STORAGE_KEY = "tur-vibes:custom-pois";

export type CustomPoi = {
  id: string;
  name: string;
  locationType: string | null;
  color: string;
  lat: number;
  lng: number;
  elevation: number | null;
  createdAt: number;
};

function loadPois(): CustomPoi[] {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomPoi[]) : [];
  } catch {
    return [];
  }
}

function savePois(pois: CustomPoi[]) {
  safeSetItem(STORAGE_KEY, JSON.stringify(pois));
}

export type PoiFilter = {
  types: string[]; // empty = all
  colors: string[]; // empty = all
};

type PoiContextValue = {
  pois: CustomPoi[];
  addPoi: (poi: Omit<CustomPoi, "id" | "createdAt" | "name">) => Promise<void>;
  removePoi: (id: string) => void;
  renamePoi: (id: string, name: string) => void;
  changePoiType: (id: string, locationType: string | null) => void;
  changePoiColor: (id: string, color: string) => void;
  selectedPoiId: string | null;
  selectPoi: (id: string | null) => void;
  movePoiLocation: (id: string, lat: number, lng: number) => Promise<void>;
  poiFilter: PoiFilter;
  setPoiFilter: (f: PoiFilter) => void;
  filterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  managePanelOpen: boolean;
  setManagePanelOpen: (open: boolean) => void;
};

const PoiContext = createContext<PoiContextValue | null>(null);

export function PoiProvider({ children }: { children: ReactNode }) {
  const [pois, setPois] = useState<CustomPoi[]>(loadPois);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [poiFilter, setPoiFilter] = useState<PoiFilter>({
    types: [],
    colors: [],
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [managePanelOpen, setManagePanelOpen] = useState(false);

  const addPoi = useCallback(
    async (poi: Omit<CustomPoi, "id" | "createdAt" | "name">) => {
      const id = `poi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      // Insert with a placeholder name immediately so the dot appears at once.
      const placeholder: CustomPoi = {
        ...poi,
        id,
        name: "…",
        locationType: null,
        color: "#3b82f6",
        elevation: poi.elevation ?? null,
        createdAt: Date.now(),
      };
      setPois((prev) => {
        const updated = [...prev, placeholder];
        savePois(updated);
        return updated;
      });
      setSelectedPoiId(id);
      // Resolve a real name from the location API, then patch.
      const resolved = await fetchNearestPlaceName({
        latitude: poi.lat,
        longitude: poi.lng,
      }).catch(() => null);
      const name = resolved?.name ?? "New POI";
      const locationType = resolved?.type ?? null;
      setPois((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, name, locationType } : p,
        );
        savePois(updated);
        return updated;
      });
    },
    [],
  );

  const removePoi = useCallback((id: string) => {
    setPois((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      savePois(updated);
      return updated;
    });
    setSelectedPoiId((cur) => (cur === id ? null : cur));
  }, []);

  const renamePoi = useCallback((id: string, name: string) => {
    setPois((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, name } : p));
      savePois(updated);
      return updated;
    });
  }, []);

  const changePoiType = useCallback(
    (id: string, locationType: string | null) => {
      setPois((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, locationType } : p,
        );
        savePois(updated);
        return updated;
      });
    },
    [],
  );

  const changePoiColor = useCallback((id: string, color: string) => {
    setPois((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, color } : p));
      savePois(updated);
      return updated;
    });
  }, []);

  const selectPoi = useCallback((id: string | null) => {
    setSelectedPoiId(id);
  }, []);

  const movePoiLocation = useCallback(
    async (id: string, lat: number, lng: number) => {
      // Update coords immediately
      setPois((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, lat, lng, elevation: null } : p,
        );
        savePois(updated);
        return updated;
      });
      // Fetch new elevation
      const elevations = await fetchElevations([
        { latitude: lat, longitude: lng },
      ]).catch(() => [null]);
      const elevation = elevations[0] ?? null;
      setPois((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, elevation } : p,
        );
        savePois(updated);
        return updated;
      });
    },
    [],
  );

  return (
    <PoiContext.Provider
      value={{
        pois,
        addPoi,
        removePoi,
        renamePoi,
        changePoiType,
        changePoiColor,
        selectedPoiId,
        selectPoi,
        movePoiLocation,
        poiFilter,
        setPoiFilter,
        filterPanelOpen,
        setFilterPanelOpen,
        managePanelOpen,
        setManagePanelOpen,
      }}
    >
      {children}
    </PoiContext.Provider>
  );
}

export function usePoi() {
  const ctx = useContext(PoiContext);
  if (!ctx) throw new Error("usePoi must be used inside PoiProvider");
  return ctx;
}
