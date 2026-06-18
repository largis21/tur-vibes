import { useRef } from "react";
import { StoreApi } from "zustand";
import {
  GeoLocationContext,
  createGeoLocationStore,
  GeoLocationStoreInternal,
} from "./createGeoLocationStore";

export function GeoLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<StoreApi<GeoLocationStoreInternal> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createGeoLocationStore();
    storeRef.current?.getState().watch();
  }

  return (
    <GeoLocationContext.Provider value={storeRef.current}>
      {children}
    </GeoLocationContext.Provider>
  );
}
