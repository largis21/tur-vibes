import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NUMBER_CODEC, STORAGE_KEYS, STRING_CODEC, usePersistedState } from "./storage";

export type BaseLayer = "topo" | "satellite";

type UiState = {
  showSteepness: boolean;
  toggleSteepness: () => void;
  setShowSteepness: (value: boolean) => void;
  /** Opacity of the steepness raster layer when shown (0..1). */
  steepnessOpacity: number;
  setSteepnessOpacity: (value: number) => void;
  /** Active base-layer group. */
  baseLayer: BaseLayer;
  setBaseLayer: (value: BaseLayer) => void;
  toggleBaseLayer: () => void;
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
};

const UiStateContext = createContext<UiState | null>(null);

const DEFAULT_STEEPNESS_OPACITY = 0.5;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function UiStateProvider({ children }: { children: ReactNode }) {
  const [showSteepness, setShowSteepness] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [steepnessOpacityRaw, setSteepnessOpacityRaw] =
    usePersistedState<number>(
      STORAGE_KEYS.steepnessOpacity,
      DEFAULT_STEEPNESS_OPACITY,
      {
        codec: NUMBER_CODEC,
        validate: (v): v is number =>
          typeof v === "number" && Number.isFinite(v),
      },
    );
  const steepnessOpacity = clamp01(steepnessOpacityRaw);

  const setSteepnessOpacity = useCallback(
    (value: number) => {
      setSteepnessOpacityRaw(clamp01(value));
    },
    [setSteepnessOpacityRaw],
  );

  const [baseLayer, setBaseLayerRaw] = usePersistedState<BaseLayer>(
    STORAGE_KEYS.baseLayer,
    "topo",
    {
      codec: STRING_CODEC as { parse: (r: string) => BaseLayer; stringify: (v: BaseLayer) => string },
      validate: (v): v is BaseLayer => v === "topo" || v === "satellite",
    },
  );
  const setBaseLayer = useCallback(
    (value: BaseLayer) => setBaseLayerRaw(value),
    [setBaseLayerRaw],
  );
  const toggleBaseLayer = useCallback(
    () => setBaseLayerRaw((v) => (v === "topo" ? "satellite" : "topo")),
    [setBaseLayerRaw],
  );

  const toggleSteepness = useCallback(() => setShowSteepness((v) => !v), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const value = useMemo<UiState>(
    () => ({
      showSteepness,
      setShowSteepness,
      toggleSteepness,
      steepnessOpacity,
      setSteepnessOpacity,
      baseLayer,
      setBaseLayer,
      toggleBaseLayer,
      sidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
    }),
    [
      showSteepness,
      toggleSteepness,
      steepnessOpacity,
      setSteepnessOpacity,
      baseLayer,
      setBaseLayer,
      toggleBaseLayer,
      sidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
    ],
  );

  return (
    <UiStateContext.Provider value={value}>{children}</UiStateContext.Provider>
  );
}

export function useUiState(): UiState {
  const value = useContext(UiStateContext);
  if (!value) {
    throw new Error("useUiState must be used within UiStateProvider");
  }
  return value;
}
