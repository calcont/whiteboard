// Light/dark theme handling. The chosen theme is stored on the <html> element
// as data-theme (CSS variables in css/variables.scss react to it) and persisted
// in localStorage so it survives reloads. MUI components follow via a matching
// palette mode wired up in App.js.

export const THEME_LIGHT = "light";
export const THEME_DARK = "dark";

const STORAGE_KEY = "wb-theme";

// Default stroke ("ink") per theme so freshly drawn shapes are visible on the
// current board — dark ink on the light board, light ink on the dark board.
export const LIGHT_INK = "#1e1e1e";
export const DARK_INK = "#e6e6ea";

export const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === THEME_LIGHT || stored === THEME_DARK) return stored;
  } catch (e) {
    // localStorage may be unavailable (private mode) — fall through.
  }
  return THEME_LIGHT;
};

// Reflect the theme onto the document and persist it.
export const applyTheme = (theme) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    // ignore persistence failures
  }
};
