import { useContext } from "react";
import { GeoLocationContext, GeoLocationStore } from "./createGeoLocationStore";
import { useStore } from "zustand/react";

export function useGeoLocation<T = GeoLocationStore>(
  selector?: (state: GeoLocationStore) => T,
): T {
  const context = useContext(GeoLocationContext);

  if (!context) {
    throw new Error("useGeolocation must be used within a GeolocationProvider");
  }

  return useStore(context, selector as (state: GeoLocationStore) => T);
}
