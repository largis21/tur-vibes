/** All selectable POI types with their display emoji */
export const POI_TYPES: { type: string; emoji: string; label: string }[] = [
  { type: "Topp", emoji: "⛰️", label: "Topp" },
  { type: "Fjell", emoji: "⛰️", label: "Fjell" },
  { type: "Haug", emoji: "🏔️", label: "Haug" },
  { type: "Ås", emoji: "🏔️", label: "Ås" },
  { type: "Bre", emoji: "🧊", label: "Bre" },
  { type: "Dal", emoji: "🏞️", label: "Dal" },
  { type: "Skar", emoji: "🏞️", label: "Skar" },
  { type: "Vidde", emoji: "🌄", label: "Vidde" },
  { type: "Innsjø", emoji: "💧", label: "Innsjø" },
  { type: "Vann", emoji: "💧", label: "Vann" },
  { type: "Tjern", emoji: "💧", label: "Tjern" },
  { type: "Elv", emoji: "🌊", label: "Elv" },
  { type: "Bekk", emoji: "🌊", label: "Bekk" },
  { type: "Vik", emoji: "🌊", label: "Vik" },
  { type: "Halvøy", emoji: "🌊", label: "Halvøy" },
  { type: "Nes", emoji: "🌊", label: "Nes" },
  { type: "Sti", emoji: "🥾", label: "Sti" },
  { type: "Turisthytte", emoji: "🏠", label: "Turisthytte" },
];

/** Maps Kartverket navneobjekttype → emoji character */
export function typeEmoji(type: string | null): string {
  if (!type) return "📍";
  switch (type) {
    case "Topp":
    case "Fjell":
      return "⛰️";
    case "Haug":
    case "Ås":
      return "🏔️";
    case "Bre":
      return "🧊";
    case "Dal":
    case "Dalføre":
    case "Skar":
      return "🏞️";
    case "Vidde":
      return "🌄";
    case "Innsjø":
    case "Vann":
    case "Tjern":
    case "Gruppe av tjern":
      return "💧";
    case "Elv":
    case "Bekk":
      return "🌊";
    case "Vik":
    case "Halvøy":
    case "Nes":
      return "🌊";
    case "Sti":
      return "🥾";
    case "Turisthytte":
      return "🏠";
    default:
      return "📍";
  }
}
