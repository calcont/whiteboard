import { isMacOS } from "../utils/platform";

// Show platform-appropriate modifier labels: Cmd (⌘) / ⇧ on macOS, Ctrl / Shift
// elsewhere. "&" is used as a separator between keys.
const MOD = isMacOS() ? "⌘" : "Ctrl";
const SHIFT = isMacOS() ? "⇧" : "Shift";

export const SHORTCUTS = [
  { name: "Select all the objects", key: `${MOD} & A` },
  { name: "Duplicate the objects", key: `${MOD} & D` },
  { name: "Delete the objects", key: "Delete" },
  { name: "Move the objects", key: "Arrow keys" },
  { name: "Zoom in", key: `${MOD} & +` },
  { name: "Zoom out", key: `${MOD} & -` },
  { name: "Multi-objects selection", key: `${SHIFT} & click` },
  { name: "Undo", key: `${MOD} & Z` },
  { name: "Redo", key: `${MOD} & ${SHIFT} & Z` },
];
