import type { IconName } from "../tools/defineTool";

const SVG: Record<IconName, string> = {
  close:
    '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  add: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  backspace:
    '<path d="M3 12l4-6h13a1 1 0 011 1v10a1 1 0 01-1 1H7l-4-6z M11 9l4 6m0-6l-4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  locate:
    '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  download:
    '<path d="M12 3v12m0 0l-4-4m4 4l4-4 M5 19h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  trash:
    '<path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  "cloud-offline":
    '<path d="M3 3l18 18 M7 18a4 4 0 010-8 6 6 0 0111 1.6 M19 14a3 3 0 01-1 5.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  "trending-up":
    '<path d="M3 17l6-6 4 4 8-8 M14 7h7v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  resize:
    '<path d="M9 3H3v6 M21 9V3h-6 M3 15v6h6 M15 21h6v-6 M21 3l-7 7 M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  "cloud-download":
    '<path d="M7 18a4 4 0 010-8 6 6 0 0111.6 2A3 3 0 0118 18 M12 12v6m0 0l-2-2m2 2l2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  shield:
    '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  cog: '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  compass:
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><polygon points="12,6 14,12 12,11 10,12" fill="currentColor"/><polygon points="12,18 10,12 12,13 14,12" fill="currentColor" opacity="0.5"/>',
};

export function Icon({
  name,
  size = 20,
  color = "currentColor",
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const html = SVG[name];
  if (!html) {
    if (import.meta.env.DEV) {
      console.warn(`Icon: unknown name "${name}"`);
    }
    return null;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block", color, flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
