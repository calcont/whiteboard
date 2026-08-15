// Light/dark theme handling. The theme is reflected on the <html> element as
// data-theme (CSS variables in css/variables.scss react to it; MUI palette
// follows via App.js). On first load we follow the OS colour scheme; once the
// user toggles, their choice is persisted in localStorage and wins over the OS.

export const THEME_LIGHT = "light";
export const THEME_DARK = "dark";

const STORAGE_KEY = "wb-theme";

// Default stroke ("ink") per theme so freshly drawn shapes are visible on the
// current board — dark ink on the light board, light ink on the dark board.
export const LIGHT_INK = "#1e1e1e";
export const DARK_INK = "#e6e6ea";

// The OS colour scheme (defaults to light if it can't be read).
export const getSystemTheme = () => {
  try {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return THEME_DARK;
    }
  } catch {
    // matchMedia may be unavailable — fall through to light.
  }
  return THEME_LIGHT;
};

// The user's explicitly-chosen theme, or null if they never toggled.
export const getStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === THEME_LIGHT || stored === THEME_DARK) return stored;
  } catch {
    // localStorage may be unavailable (private mode) — fall through.
  }
  return null;
};

// A manual choice wins; otherwise follow the OS.
export const getInitialTheme = () => getStoredTheme() || getSystemTheme();

// Reflect the theme onto the document (no persistence — see persistTheme).
export const applyTheme = (theme) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
};

// Persist an explicit user choice so it overrides the OS on later loads.
export const persistTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore persistence failures
  }
};
