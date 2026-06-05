import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";

const COLORS: Record<string, string> = {
  log: "\x1b[37m",
  info: "\x1b[36m",
  debug: "\x1b[90m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

function getBuildInfo() {
  try {
    const gitRef = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    })
      .toString()
      .trim();
    const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return {
      gitRef,
      gitBranch,
      buildDate: new Date().toISOString(),
    };
  } catch {
    return {
      gitRef: "unknown",
      gitBranch: "unknown",
      buildDate: new Date().toISOString(),
    };
  }
}

function buildInfoPlugin(): Plugin {
  const buildInfo = getBuildInfo();
  return {
    name: "build-info",
    config(config, env) {
      if (!config.define) {
        config.define = {};
      }
      config.define.__BUILD_INFO__ = JSON.stringify(buildInfo);
    },
  };
}

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
    tailwindcss(),
    react(),
    remoteLogPlugin(),
    buildInfoPlugin(),
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
          // Android launcher icons
          {
            src: "icons/android/launchericon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "icons/android/launchericon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "icons/android/launchericon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "icons/android/launchericon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "icons/android/launchericon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/android/launchericon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          // iOS app icons (for bookmark/home screen)
          {
            src: "icons/ios/180.png",
            sizes: "180x180",
            type: "image/png",
          },
          {
            src: "icons/ios/192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/ios/512.png",
            sizes: "512x512",
            type: "image/png",
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
    port: 5173,
    allowedHosts: ["mildly-epic-eel.ngrok-free.app"],
  },
});
