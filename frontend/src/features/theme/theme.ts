export type ThemePreference = "light" | "dark";

const STORAGE_KEY = "nexus-erp-theme";

export function getThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === "dark") return "dark";
  } catch {
    // Storage may be unavailable.
  }

  return "light";
}

export function applyTheme(theme: ThemePreference) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function saveThemePreference(theme: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable.
  }

  applyTheme(theme);
}
