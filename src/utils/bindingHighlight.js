import { fabric } from "fabric";

// Live "this will bind" affordance: while an arrow is drawn or an endpoint is
// dragged, the shape(s) it will connect to get a soft highlight (like
// Excalidraw). Highlights are transient, non-interactive, never persisted
// (excludeFromExport) and flagged __nonBindable so they can't target themselves.
// Kept on canvas.__bindHL; cleared on drop.

// An additional border layer drawn ON the target's exact outline (no padding),
// so the shape's own border "lights up" (Excalidraw-style). Shape-aware: an
// ellipse target gets an ellipse outline; a rounded rect matches its radius.
const STROKE = "#6965db"; // clean violet-indigo accent

const overlayProps = {
  fill: "transparent",
  stroke: STROKE,
  strokeWidth: 2,
  selectable: false,
  evented: false,
  excludeFromExport: true,
  __nonBindable: true,
  originX: "left",
  originY: "top",
};

const makeOverlay = (shape) => {
  const b = shape.getBoundingRect(true, true); // exact scene bbox (incl. stroke)
  if (shape.type === "ellipse" || shape.type === "circle") {
    return new fabric.Ellipse({
      ...overlayProps,
      left: b.left,
      top: b.top,
      rx: b.width / 2,
      ry: b.height / 2,
    });
  }
  // Match the shape's rounded corners when it has them (rect); else hug tight.
  const rx = shape.rx ? shape.rx * Math.abs(shape.scaleX || 1) : 6;
  return new fabric.Rect({
    ...overlayProps,
    left: b.left,
    top: b.top,
    width: b.width,
    height: b.height,
    rx,
    ry: rx,
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
    const r = makeOverlay(s);
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
