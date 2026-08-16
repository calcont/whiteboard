import { useEffect, useRef } from "react";
import { useCanvasContext, useThemeContext } from "../../hooks";
import { dimColor } from "../../utils/themeColor";
import { isLabeledShape, getLabelParts } from "../../utils/shapeLabel";

// Shapes whose FILL is a user-chosen colour that should soften on the dark
// board. Arrows/lines have no fill, text colour is the ink, and imported logos
// (icon groups) keep their own brand colours — all left untouched.
const FILLABLE = new Set(["rect", "ellipse", "triangle", "polygon"]);

// Flip one object's fill between its light-mode and dark-mode tone. dimColor is
// self-inverse, so the same call toggles either way.
const toggleObjectFill = (obj) => {
  if (FILLABLE.has(obj.type)) {
    obj.set({ fill: dimColor(obj.fill) });
    obj.dirty = true;
  } else if (isLabeledShape(obj)) {
    const { shape } = getLabelParts(obj);
    if (shape) {
      shape.set({ fill: dimColor(shape.fill) });
      obj.dirty = true;
    }
  }
};

// Softens shape fills on the dark board (excalidraw-style) and restores them in
// light mode. Fills are stored in their *displayed* state, and dimColor is
// self-inverse, so a theme change just re-applies it to every shape — no
// original-colour bookkeeping. New/edited shapes are dimmed at creation time in
// toolStyle/PropertiesPanel, so they too are stored already-dimmed in dark mode.
function DarkColorHandler() {
  const { canvas } = useCanvasContext();
  const { theme } = useThemeContext();
  const firstRun = useRef(true);

  useEffect(() => {
    if (!canvas) return;
    // Skip the initial mount: the loaded scene's fills already match the loaded
    // theme (both persist). Only a real theme CHANGE should flip them.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    canvas.getObjects().forEach(toggleObjectFill);
    canvas.requestRenderAll();
    // Persist the flipped scene without adding an undo entry — obj.set fires no
    // events, so nudge the debounced save via background:changed (which
    // persistence listens to but fabric-history does not).
    canvas.fire("background:changed");
  }, [theme, canvas]);
}

export default DarkColorHandler;
