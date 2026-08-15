// Persist the last-used drawing style (colour, width, fill, font, arrowheads)
// in localStorage so a reload restores the user's last choices instead of
// resetting to defaults. localStorage (not IndexedDB) — it's a tiny, plain
// object, kept separate from the (larger) scene record.

import { DEFAULT_STYLE } from "../Handlers/ToolsHandler/toolStyle";
import { getInitialTheme, THEME_DARK, LIGHT_INK, DARK_INK } from "./theme";

const KEY = "wb-style";

// Default style whose ink matches the INITIAL theme, so shapes drawn on a
// system-dark board come out light (visible) even before any manual theme
// toggle — the toggle's ink-swap only fires on a manual switch.
const themedDefault = () => ({
  ...DEFAULT_STYLE,
  stroke: getInitialTheme() === THEME_DARK ? DARK_INK : LIGHT_INK,
});

export const getStoredStyle = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return themedDefault();
    const parsed = JSON.parse(raw);
    // Merge onto the themed default; a stored choice wins.
    return { ...themedDefault(), ...parsed };
  } catch (e) {
    return themedDefault();
  }
};

export const saveStyle = (style) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(style));
  } catch (e) {
    // best-effort; never break drawing over a persistence failure
  }
};
