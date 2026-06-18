import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { fetchNearestPlaceName, fetchElevations } from "../../lib/elevation";
import { STORAGE_KEYS, usePersistedState } from "../../lib/storage";
import { z } from "zod";

const CustomPoiSchema = z.object({
  id: z.string(),
  name: z.string(),
  locationType: z.string().nullable(),
  color: z.string(),
  lat: z.number(),
  lng: z.number(),
  elevation: z.number().nullable(),
  createdAt: z.number(),
});

export type CustomPoi = z.infer<typeof CustomPoiSchema>;

function isCustomPoiArray(value: unknown): value is CustomPoi[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    try {
      CustomPoiSchema.parse(item);
      return true;
    } catch {
      return false;
    }
  });
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
  const [pois, setPois] = usePersistedState<CustomPoi[]>(
    STORAGE_KEYS.customPois,
    [],
    { validate: isCustomPoiArray },
  );
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
      const placeholder: CustomPoi = {
        ...poi,
        id,
        name: "…",
        locationType: null,
        color: "#3b82f6",
        elevation: poi.elevation ?? null,
        createdAt: Date.now(),
      };
      setPois((prev) => [...prev, placeholder]);
      setSelectedPoiId(id);
      // Resolve a real name from the location API and fetch elevation, then patch.
      const [resolved, elevations] = await Promise.all([
        fetchNearestPlaceName({
          latitude: poi.lat,
          longitude: poi.lng,
        }).catch(() => null),
        fetchElevations([{ latitude: poi.lat, longitude: poi.lng }]).catch(
          () => [null],
        ),
      ]);
      const name = resolved?.name ?? "New POI";
      const locationType = resolved?.type ?? null;
      const elevation = elevations[0] ?? null;
      setPois((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, name, locationType, elevation } : p,
        ),
      );
    },
    [setPois],
  );

  const removePoi = useCallback(
    (id: string) => {
      setPois((prev) => prev.filter((p) => p.id !== id));
      setSelectedPoiId((cur) => (cur === id ? null : cur));
    },
    [setPois],
  );

  const renamePoi = useCallback(
    (id: string, name: string) => {
      setPois((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    },
    [setPois],
  );

  const changePoiType = useCallback(
    (id: string, locationType: string | null) => {
      setPois((prev) =>
        prev.map((p) => (p.id === id ? { ...p, locationType } : p)),
      );
    },
    [setPois],
  );

  const changePoiColor = useCallback(
    (id: string, color: string) => {
      setPois((prev) => prev.map((p) => (p.id === id ? { ...p, color } : p)));
    },
    [setPois],
  );

  const selectPoi = useCallback((id: string | null) => {
    setSelectedPoiId(id);
  }, []);

  const movePoiLocation = useCallback(
    async (id: string, lat: number, lng: number) => {
      // Update coords immediately
      setPois((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, lat, lng, elevation: null } : p,
        ),
      );
      // Fetch new elevation
      const elevations = await fetchElevations([
        { latitude: lat, longitude: lng },
      ]).catch(() => [null]);
      const elevation = elevations[0] ?? null;
      setPois((prev) =>
        prev.map((p) => (p.id === id ? { ...p, elevation } : p)),
      );
    },
    [setPois],
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
