import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { safeGetItem, safeSetItem, STORAGE_KEYS } from "./storage";

type OnboardingValue = {
  /** Whether onboarding has been completed. */
  isCompleted: boolean;
  /** Mark onboarding as completed. */
  markCompleted: () => void;
};

const OnboardingContext = createContext<OnboardingValue | null>(null);

function loadOnboardingState(): boolean {
  const raw = safeGetItem(STORAGE_KEYS.onboardingCompleted);
  return raw === "true";
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isCompleted, setIsCompleted] = useState(() => loadOnboardingState());

  const markCompleted = useCallback(() => {
    setIsCompleted(true);
    safeSetItem(STORAGE_KEYS.onboardingCompleted, "true");
  }, []);

  const value = useMemo<OnboardingValue>(
    () => ({
      isCompleted,
      markCompleted,
    }),
    [isCompleted, markCompleted],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingValue {
  const value = useContext(OnboardingContext);
  if (!value) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return value;
}
