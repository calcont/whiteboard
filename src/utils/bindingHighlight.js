import { fabric } from "fabric";

// Live "this will bind" affordance: while an arrow is drawn or an endpoint is
// dragged, the shape(s) it will connect to get a soft highlight (like
// Excalidraw). Highlights are transient, non-interactive, never persisted
// (excludeFromExport) and flagged __nonBindable so they can't target themselves.
// Kept on canvas.__bindHL; cleared on drop.

const STROKE = "#6366f1"; // soft indigo
const FILL = "rgba(99,102,241,0.09)"; // faint tint, not a heavy border
const PAD = 4;

const makeRect = (shape) => {
  const b = shape.getBoundingRect(true, true);
  return new fabric.Rect({
    left: b.left - PAD,
    top: b.top - PAD,
    width: b.width + PAD * 2,
    height: b.height + PAD * 2,
    rx: 14,
    ry: 14,
    fill: FILL,
    stroke: STROKE,
    strokeWidth: 1.5,
    selectable: false,
    evented: false,
    excludeFromExport: true,
    __nonBindable: true,
    originX: "left",
    originY: "top",
  });
};

const sameSet = (a, b) =>
  a.length === b.length && a.every((s, i) => s === b[i]);

// Highlight exactly `shapes` (a shape, an array, or falsy to clear). Skips the
// rebuild when the set is unchanged so a drag doesn't churn objects each frame.
export const showBindHighlight = (canvas, shapes) => {
  const list = [
    ...new Set((Array.isArray(shapes) ? shapes : [shapes]).filter(Boolean)),
  ];
  if (canvas.__bindHLShapes && sameSet(canvas.__bindHLShapes, list)) return;
  clearBindHighlight(canvas);
  if (!list.length) return;
  const rects = list.map((s) => {
    const r = makeRect(s);
    canvas.add(r);
    canvas.bringToFront(r);
    return r;
  });
  canvas.__bindHL = rects;
  canvas.__bindHLShapes = list;
  canvas.requestRenderAll();
};

export const clearBindHighlight = (canvas) => {
  const arr = canvas && canvas.__bindHL;
  if (arr && arr.length) {
    arr.forEach((r) => canvas.remove(r));
    canvas.requestRenderAll();
  }
  if (canvas) {
    canvas.__bindHL = [];
    canvas.__bindHLShapes = [];
  }
};
