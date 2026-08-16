// Persist the last-used drawing style (colour, width, fill, font, arrowheads)
// in localStorage so a reload restores the user's last choices instead of
// resetting to defaults. localStorage (not IndexedDB) — it's a tiny, plain
// object, kept separate from the (larger) scene record.

import { DEFAULT_STYLE, FONT_SIZES } from "../Handlers/ToolsHandler/toolStyle";
import { getInitialTheme, THEME_DARK, LIGHT_INK, DARK_INK } from "./theme";

// Snap an arbitrary size onto the nearest current preset. A legacy stored size
// (from an older S/M/L scale, e.g. 12) is no longer one of the presets, which
// left the Size control with nothing highlighted; snapping keeps it in sync so
// a preset is always active and new text uses a real preset value.
const snapToPreset = (size) => {
  const presets = FONT_SIZES.map((s) => s.value);
  if (presets.includes(size)) return size;
  return presets.reduce((a, b) =>
    Math.abs(b - size) < Math.abs(a - size) ? b : a,
  );
};

const KEY = "wb-style";
// Bumped when the default style changes in a way existing stored styles should
// pick up. v2: default font Arial -> Comic Sans MS. v3: font-size default
// 24 -> 16 (labels were overflowing). v4: default 16 -> 20 (16 read too small).
const STYLE_VERSION = 4;
const PREVIOUS_DEFAULT_FONT = "Arial";
// Superseded default font sizes (pre-v4): the original 24 and the v3 16. Anyone
// still parked on one of these gets bumped to the current default.
const LEGACY_DEFAULT_FONT_SIZES = [24, 16];

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
    const merged = { ...themedDefault(), ...parsed };
    // One-time migration to the Comic Sans MS default: pre-versioned styles that
    // still carry the old Arial default are upgraded. An Arial chosen after this
    // (stored with the current version) is left alone.
    if (!parsed._v && parsed.fontFamily === PREVIOUS_DEFAULT_FONT) {
      merged.fontFamily = DEFAULT_STYLE.fontFamily;
    }
    // The font-size default has moved (24 -> 16 -> 20). Bump anyone still on a
    // superseded default up to the current one. A size deliberately chosen at
    // the current version (stored _v >= 4) is left alone.
    if (
      (parsed._v || 0) < 4 &&
      LEGACY_DEFAULT_FONT_SIZES.includes(parsed.fontSize)
    ) {
      merged.fontSize = DEFAULT_STYLE.fontSize;
    }
    // Keep the effective size on a real preset so the Size control is never
    // blank (covers legacy sizes the version migration above doesn't name).
    merged.fontSize = snapToPreset(merged.fontSize);
    merged._v = STYLE_VERSION;
    return merged;
  } catch {
    return themedDefault();
  }
};

export const saveStyle = (style) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(style));
  } catch {
    // best-effort; never break drawing over a persistence failure
  }
};
