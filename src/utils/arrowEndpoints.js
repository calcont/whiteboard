import { fabric } from "fabric";
import { getArrowParts } from "./shapeLabel";

// Excalidraw-style endpoint handles for arrows: two draggable controls at the
// tail (e1) and tip (e2). Dragging one re-aims/extends the arrow by mutating
// its line + head(s) + label IN PLACE (no group rebuild mid-drag), keeping the
// group's centre fixed so the children keep rendering correctly. The group's
// bounding box is re-fitted on drop.

const angleDeg = (a, b) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

const IDENTITY = [1, 0, 0, 1, 0, 0];
// The group's full object->screen matrix. Guards the case where the group
// isn't on a canvas yet (buildArrowGroup calls setCoords() before canvas.add,
// which triggers the control positionHandlers with no canvas/viewport).
const screenMatrix = (group) =>
  fabric.util.multiplyTransformMatrices(
    group.canvas ? group.canvas.viewportTransform : IDENTITY,
    group.calcTransformMatrix(),
  );

// Endpoint positions in group-local coordinates (relative to the group centre).
const localEndpoints = (group) => {
  const { line } = getArrowParts(group);
  const lp = line.calcLinePoints();
  return {
    e1: { x: line.left + lp.x1, y: line.top + lp.y1 }, // tail (line start)
    e2: { x: line.left + lp.x2, y: line.top + lp.y2 }, // tip (line end)
  };
};

// Move one endpoint to `local` (group-local coords) and rebuild the line, the
// head(s) and the label around the new segment — all in group-local space.
export const reshapeArrow = (group, key, local) => {
  const { line, heads, text } = getArrowParts(group);
  const ends = localEndpoints(group);
  const start = key === "e1" ? local : ends.e1;
  const end = key === "e2" ? local : ends.e2;

  line.set({ x1: start.x, y1: start.y, x2: end.x, y2: end.y });
  line._setWidthHeight(); // re-derives the line's centre + bbox from the points
  line.setCoords();

  // heads[0] sits at the tip (line end); a second head (double-ended) at tail.
  if (heads[0]) {
    heads[0].set({ left: end.x, top: end.y, angle: angleDeg(start, end) });
    heads[0].setCoords();
  }
  if (heads[1]) {
    heads[1].set({ left: start.x, top: start.y, angle: angleDeg(end, start) });
    heads[1].setCoords();
  }
  if (text) {
    text.set({ left: (start.x + end.x) / 2, top: (start.y + end.y) / 2 });
    text.setCoords();
  }
  group.dirty = true;
};

// Re-fit the group's bounding box to its (mutated) children while preserving
// their on-screen positions — so per-pixel hit-testing and future moves are
// correct after an endpoint drag. Mirrors fabric's own addWithUpdate sequence:
// bake the current transform into the children (absolute coords), reset the
// group transform, then recompute the bounds and re-base the children. Skipping
// the restore/reset (as a naive _calcBounds does) shifts everything.
export const refitArrowBounds = (group) => {
  group._restoreObjectsState();
  fabric.util.resetObjectTransform(group);
  group._calcBounds();
  group._updateObjectsCoords();
  group.setCoords();
  group.dirty = true;
};

const positionHandler = (key) =>
  function (dim, finalMatrix, fabricObject) {
    const p = localEndpoints(fabricObject)[key];
    return fabric.util.transformPoint(
      new fabric.Point(p.x, p.y),
      screenMatrix(fabricObject),
    );
  };

const actionHandler = (key) =>
  function (eventData, transform, x, y) {
    const group = transform.target;
    const inv = fabric.util.invertTransform(screenMatrix(group));
    const local = fabric.util.transformPoint(new fabric.Point(x, y), inv);
    reshapeArrow(group, key, local);
    return true;
  };

const renderHandle = (ctx, left, top) => {
  const r = 5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(left, top, r, 0, 2 * Math.PI, false);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#4f46e5";
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

const makeControl = (key) =>
  new fabric.Control({
    positionHandler: positionHandler(key),
    actionHandler: actionHandler(key),
    actionName: "arrowEndpoint",
    cursorStyle: "crosshair",
    render: renderHandle,
    mouseUpHandler: (eventData, transform) => {
      refitArrowBounds(transform.target);
      return true;
    },
  });

// Replace an arrow group's default (bounding-box) controls with the two
// endpoint handles. Called from buildArrowGroup so every arrow gets them.
export const attachEndpointControls = (group) => {
  group.controls = { e1: makeControl("e1"), e2: makeControl("e2") };
  group.hasBorders = false; // no bbox outline — just the two endpoint dots
};
