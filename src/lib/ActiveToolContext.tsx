import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ActiveToolValue = {
  activeToolId: string | null;
  setActiveToolId: (id: string | null) => void;
  /** Toggle the given tool — activate if inactive, deactivate if currently active. */
  toggleTool: (id: string) => void;
  deactivateTool: () => void;
};

const ActiveToolContext = createContext<ActiveToolValue | null>(null);

export function ActiveToolProvider({ children }: { children: ReactNode }) {
  const [activeToolId, setActiveToolIdState] = useState<string | null>(null);

  const setActiveToolId = useCallback((id: string | null) => {
    setActiveToolIdState(id);
  }, []);

  const toggleTool = useCallback((id: string) => {
    setActiveToolIdState((current) => (current === id ? null : id));
  }, []);

  const deactivateTool = useCallback(() => {
    setActiveToolIdState(null);
  }, []);

  const value = useMemo<ActiveToolValue>(
    () => ({ activeToolId, setActiveToolId, toggleTool, deactivateTool }),
    [activeToolId, setActiveToolId, toggleTool, deactivateTool],
  );

  return (
    <ActiveToolContext.Provider value={value}>
      {children}
    </ActiveToolContext.Provider>
  );
}

export function useActiveTool(): ActiveToolValue {
  const value = useContext(ActiveToolContext);
  if (!value) {
    throw new Error("useActiveTool must be used within ActiveToolProvider");
  }
  return value;
}
