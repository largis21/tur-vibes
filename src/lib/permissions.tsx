import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from "./storage";

type Status = "unknown" | "granted" | "denied";

type PermissionsState = {
  location: Status;
  orientation: Status;
};

type IOSOrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function getIOSOrientationCtor(): IOSOrientationCtor | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.DeviceOrientationEvent as IOSOrientationCtor | undefined;
  if (!Ctor || typeof Ctor.requestPermission !== "function") return null;
  return Ctor;
}

function isStatus(v: unknown): v is Status {
  return v === "unknown" || v === "granted" || v === "denied";
}

function loadStored(): PermissionsState {
  const raw = safeGetJSON<Record<string, unknown>>(
    STORAGE_KEYS.permissions,
    {},
  );
  return {
    location: isStatus(raw.location) ? raw.location : "unknown",
    orientation: isStatus(raw.orientation) ? raw.orientation : "unknown",
  };
}

function persist(state: PermissionsState) {
  safeSetJSON(STORAGE_KEYS.permissions, state);
}

type PermissionsValue = PermissionsState & {
  /** Toggle location permission. Setting to true triggers a real geolocation prompt. */
  setLocation: (granted: boolean) => Promise<void>;
  /** Toggle device-orientation permission. Setting to true triggers iOS's prompt. */
  setOrientation: (granted: boolean) => Promise<void>;
};

const PermissionsContext = createContext<PermissionsValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PermissionsState>(() => loadStored());

  useEffect(() => {
    persist(state);
  }, [state]);

  const setLocation = useCallback(async (granted: boolean) => {
    if (!granted) {
      setState((s) => ({ ...s, location: "denied" }));
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, location: "denied" }));
      return;
    }
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setState((s) => ({ ...s, location: "granted" }));
          resolve();
        },
        () => {
          setState((s) => ({ ...s, location: "denied" }));
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }, []);

  const setOrientation = useCallback(async (granted: boolean) => {
    if (!granted) {
      setState((s) => ({ ...s, orientation: "denied" }));
      return;
    }
    const Ctor = getIOSOrientationCtor();
    if (!Ctor) {
      // Non-iOS: orientation events are available without a prompt.
      setState((s) => ({ ...s, orientation: "granted" }));
      return;
    }
    try {
      // Must be called synchronously inside a user gesture (the toggle click).
      const result = await Ctor.requestPermission!();
      setState((s) => ({
        ...s,
        orientation: result === "granted" ? "granted" : "denied",
      }));
    } catch {
      setState((s) => ({ ...s, orientation: "denied" }));
    }
  }, []);

  const value = useMemo<PermissionsValue>(
    () => ({ ...state, setLocation, setOrientation }),
    [state, setLocation, setOrientation],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsValue {
  const value = useContext(PermissionsContext);
  if (!value) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return value;
}
