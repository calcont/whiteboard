import { fabric } from "fabric";
import { getArrowParts } from "./shapeLabel";

// Excalidraw-style endpoint handles for arrows: two draggable controls at the
// tail (e1) and tip (e2). Dragging one re-aims/extends the arrow by mutating
// its line + head(s) + label IN PLACE (no group rebuild mid-drag), keeping the
// group's centre fixed so the children keep rendering correctly. The group's
// bounding box is re-fitted on drop.
//
// Extension seams (kept deliberately small — features aren't built yet):
//  - applyEndpointsLocal() is the SINGLE place that knows how an arrow is laid
//    out from its two endpoints. Every mutation (endpoint drag, programmatic
//    re-route) funnels through it, so new sources of endpoint positions don't
//    duplicate layout logic.
//  - setArrowEndpoints(group, tailScene, tipScene) re-routes an arrow from
//    absolute (scene) coords — the entry point a future SHAPE-BINDING feature
//    (A3) would call from a shape's object:moving to keep a bound arrow glued.
//    NOTE: binding also needs a *persisted* arrow<->shape reference, which the
//    current structure-only model (no custom props) can't hold — that's the
//    real work for A3, not the re-routing.
//  - BENDING (A2): a bent/elbow arrow means the single `line` child becomes a
//    multi-point polyline/path. isArrow (shapeLabel) + applyEndpointsLocal are
//    where that generalisation would land; the head/label/refit logic stays.

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

// The single source of truth for arrow layout: rewrite the line, head(s) and
// label to a straight segment between `start` and `end`, both in GROUP-LOCAL
// coords (relative to the group centre, which is left unchanged so children
// keep rendering). All endpoint mutations funnel through here.
const applyEndpointsLocal = (group, start, end) => {
  const { line, heads, text } = getArrowParts(group);

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

// Drag ONE endpoint to `local` (group-local coords), keeping the other put.
// Used live by the control handler each frame (no bounds re-fit for speed).
export const reshapeArrow = (group, key, local) => {
  const ends = localEndpoints(group);
  applyEndpointsLocal(
    group,
    key === "e1" ? local : ends.e1,
    key === "e2" ? local : ends.e2,
  );
};

// Re-route an arrow to new endpoints given in absolute (scene) coords, and
// re-fit its bounds. The programmatic entry point (e.g. a future bound shape
// moving) — callers just say "put the ends here" and the arrow model handles
// the rest.
export const setArrowEndpoints = (group, tailScene, tipScene) => {
  const inv = fabric.util.invertTransform(group.calcTransformMatrix());
  const toLocal = (p) =>
    fabric.util.transformPoint(new fabric.Point(p.x, p.y), inv);
  applyEndpointsLocal(group, toLocal(tailScene), toLocal(tipScene));
  refitArrowBounds(group);
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
    cursorStyle: "pointer",
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
