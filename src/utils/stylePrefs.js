// Persist the last-used drawing style (colour, width, fill, font, arrowheads)
// in localStorage so a reload restores the user's last choices instead of
// resetting to defaults. localStorage (not IndexedDB) — it's a tiny, plain
// object, kept separate from the (larger) scene record.

import { DEFAULT_STYLE } from "../Handlers/ToolsHandler/toolStyle";

const KEY = "wb-style";

export const getStoredStyle = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STYLE;
    const parsed = JSON.parse(raw);
    // Merge onto defaults so a newly-added style field is never missing.
    return { ...DEFAULT_STYLE, ...parsed };
  } catch (e) {
    return DEFAULT_STYLE;
  }
};

export const saveStyle = (style) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(style));
  } catch (e) {
    // best-effort; never break drawing over a persistence failure
  }
};
