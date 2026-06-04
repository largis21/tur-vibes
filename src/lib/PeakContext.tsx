import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Peak = {
  id: string | number;
  name: string | null;
  ele: number | null;
  prominence: number | null;
  lat: number;
  lng: number;
};

type PeakContextValue = {
  selectedPeak: Peak | null;
  selectPeak: (peak: Peak | null) => void;
};

const PeakContext = createContext<PeakContextValue | null>(null);

export function PeakProvider({ children }: { children: ReactNode }) {
  const [selectedPeak, setSelectedPeak] = useState<Peak | null>(null);

  const selectPeak = useCallback((peak: Peak | null) => {
    setSelectedPeak(peak);
  }, []);

  return (
    <PeakContext.Provider value={{ selectedPeak, selectPeak }}>
      {children}
    </PeakContext.Provider>
  );
}

export function usePeak() {
  const ctx = useContext(PeakContext);
  if (!ctx) throw new Error("usePeak must be used inside PeakProvider");
  return ctx;
}
