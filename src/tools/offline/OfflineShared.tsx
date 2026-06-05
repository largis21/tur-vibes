export { ToggleSwitch } from "../../components/ui";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Tailwind class string for icon buttons */
export const iconButton =
  "w-10 h-10 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center flex-shrink-0 transition-colors";

/** Tailwind class string for primary buttons */
export const primaryButton =
  "flex items-center justify-center gap-2 px-3.5 py-3 rounded-lg bg-accent hover:bg-accent-light text-white font-bold text-sm transition-colors";
