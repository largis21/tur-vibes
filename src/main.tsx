import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import { setupRemoteLogging } from "./lib/remoteLog";
import { setupLogger, logger } from "./lib/logger";

setupRemoteLogging();
setupLogger();
registerSW({ immediate: true });

logger.info("App initialized");

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
