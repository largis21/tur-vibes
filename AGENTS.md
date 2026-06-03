# Tur Vibes — Vite PWA

Offline-capable hiking map. Stack:
- Vite + React + TypeScript
- MapLibre GL JS via `react-map-gl/maplibre`
- `vite-plugin-pwa` (workbox) for the service worker / app shell
- IndexedDB for offline tile storage (custom MapLibre `addProtocol` handler)
- localStorage for app state (saved regions, last camera, offline-mode toggle)

## Commands
- `npm run dev` — dev server (HMR)
- `npm run build` — typecheck + production build (outputs to `dist/`)
- `npm run preview` — serve the built app
- `npm run typecheck` — `tsc --noEmit`

## Notes
- Map tiles never go through the service worker. The SW only precaches the app
  shell. Tile fetches go to HTTP (online) or to IndexedDB via the
  `offline-topo://` / `offline-steepness://` custom protocol (offline mode).
- React 18, not 19 — `react-map-gl@7` does not support React 19.
