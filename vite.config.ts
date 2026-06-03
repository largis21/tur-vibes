import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const COLORS: Record<string, string> = {
  log: "\x1b[37m",
  info: "\x1b[36m",
  debug: "\x1b[90m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

function remoteLogPlugin(): Plugin {
  return {
    name: "remote-log",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__log", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = "";
        req.setEncoding("utf8");
        req.on("data", (c: string) => {
          body += c;
        });
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body) as {
              sessionId?: string;
              entries?: { level: string; parts: string[]; t: number }[];
            };
            const sid = parsed.sessionId ?? "?";
            for (const entry of parsed.entries ?? []) {
              const color = COLORS[entry.level] ?? "";
              const time = new Date(entry.t).toLocaleTimeString();
              // eslint-disable-next-line no-console
              console.log(
                `${color}[${time}] [${sid}] ${entry.level}${RESET} ${entry.parts.join(" ")}`,
              );
            }
            res.statusCode = 204;
            res.end();
          } catch (err) {
            res.statusCode = 400;
            res.end(String(err));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    remoteLogPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/**/*"],
      manifest: {
        name: "Tur Vibes",
        short_name: "Tur Vibes",
        description: "Offline-capable hiking map",
        theme_color: "#4a7c4e",
        background_color: "#4a7c4e",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "assets/icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "assets/icon.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "assets/adaptive-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the app shell. Map tiles are managed manually via IndexedDB.
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json,webmanifest}",
        ],
        // Allow large assets (e.g. maplibre-gl bundle).
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // SPA fallback so any deep route works offline.
        navigateFallback: "index.html",
        // Don't intercept map tile requests — those are served via the
        // custom MapLibre `offline-*://` protocol or direct HTTP.
        navigateFallbackDenylist: [/^\/api\//, /\/tiles\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ],
  server: {
    host: true,
    allowedHosts: ["mildly-epic-eel.ngrok-free.app"],
  },
  preview: {
    allowedHosts: ["mildly-epic-eel.ngrok-free.app"],
  },
});
