export const THEMES = [
  { id: "paper", label: "Paper", scheme: "light", color: "#f3efe6" },
  { id: "night", label: "Night", scheme: "dark", color: "#12110e" },
  { id: "grove", label: "Grove", scheme: "light", color: "#eef3e8" },
  { id: "harbor", label: "Harbor", scheme: "light", color: "#e8eef4" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function normalizeTheme(value: string | undefined): ThemeId {
  if (value === "dark" || value === "night") return "night";
  if (value === "grove") return "grove";
  if (value === "harbor") return "harbor";
  return "paper";
}
