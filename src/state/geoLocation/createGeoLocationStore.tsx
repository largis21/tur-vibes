import { createStore, StoreApi } from "zustand";
import { createContext } from "react";
import {
  createGeoLocationSample,
  GeolocationSample,
} from "./geoLocationSample";

export type GeoLocationStore = {
  /**
   * Subscribe to this to get the always latest user position
   */
  userPosition: GeolocationSample | null;
  /**
   * Use this to get the user position once, without subscribing to updates. Useful for one-off actions like centering the map on the user's location when they click a button.
   */
  getUserPosition: () => Promise<GeolocationSample | null>;
  _watchId: number | null;
  watch: () => void;
};

export type GeoLocationStoreInternal = GeoLocationStore & {
  _watchId: number | null;
};

export const GeoLocationContext =
  createContext<StoreApi<GeoLocationStoreInternal> | null>(null);

export function createGeoLocationStore(): StoreApi<GeoLocationStoreInternal> {
  return createStore((set, get) => ({
    userPosition: null,
    getUserPosition: () => {
      const existingUserPosition = get().userPosition;
      if (existingUserPosition) {
        return Promise.resolve(existingUserPosition);
      } else {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              const sample = createGeoLocationSample(p);
              set({ userPosition: sample });
              resolve(sample);
              get().watch();
            },
            (err) => {
              console.error("Geolocation error:", err.code, err.message);
              reject(err); // Reject the promise on error
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
          );
        });
      }
    },

    _watchId: null,
    watch: () => {
      const existingWatchId = get()._watchId;
      if (existingWatchId !== null) {
        return navigator.geolocation.clearWatch(existingWatchId);
      }

      const watchId = navigator.geolocation.watchPosition(
        (p) => {
          const sample = createGeoLocationSample(p);
          set({ userPosition: sample });
        },
        (err) => {
          console.error("Geolocation error:", err.message, err.code, err);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );

      set({ _watchId: watchId });
    },
  }));
}
