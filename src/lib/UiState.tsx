import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UiState = {
  showSteepness: boolean;
  toggleSteepness: () => void;
  setShowSteepness: (value: boolean) => void;
  /** Opacity of the steepness raster layer when shown (0..1). */
  steepnessOpacity: number;
  setSteepnessOpacity: (value: number) => void;
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
};

const UiStateContext = createContext<UiState | null>(null);

const STEEPNESS_OPACITY_KEY = "tur-vibes:steepness-opacity";
const DEFAULT_STEEPNESS_OPACITY = 0.5;

function loadSteepnessOpacity(): number {
  try {
    const raw = localStorage.getItem(STEEPNESS_OPACITY_KEY);
    if (raw == null) return DEFAULT_STEEPNESS_OPACITY;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_STEEPNESS_OPACITY;
    return Math.min(1, Math.max(0, parsed));
  } catch {
    return DEFAULT_STEEPNESS_OPACITY;
  }
}

export function UiStateProvider({ children }: { children: ReactNode }) {
  const [showSteepness, setShowSteepness] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [steepnessOpacity, setSteepnessOpacityState] = useState(() =>
    loadSteepnessOpacity(),
  );

  const setSteepnessOpacity = useCallback((value: number) => {
    setSteepnessOpacityState(Math.min(1, Math.max(0, value)));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STEEPNESS_OPACITY_KEY, String(steepnessOpacity));
    } catch {
      // ignore
    }
  }, [steepnessOpacity]);

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
