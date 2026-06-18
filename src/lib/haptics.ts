import { WebHaptics } from "web-haptics";

// One shared instance. Lazily created so SSR / non-browser contexts are safe.
let instance: WebHaptics | null = null;

function getInstance(): WebHaptics | null {
  if (typeof window === "undefined") return null;
  if (!instance) {
    instance = new WebHaptics();
  }
  return instance;
}

type HapticPreset =
  | "success"
  | "warning"
  | "error"
  | "light"
  | "medium"
  | "heavy"
  | "soft"
  | "rigid"
  | "selection"
  | "nudge"
  | "buzz";

/** Fire a short haptic. Silently no-ops on unsupported devices. */
export function haptic(preset: HapticPreset = "selection"): void {
  const h = getInstance();
  if (!h) return;

  h.trigger(10);

  h.trigger(preset).catch((err) => {
    console.error("err", err);
    // Ignore — haptics are best-effort.
  });
}
