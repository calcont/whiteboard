import { fabric } from "fabric";
import { isArrow } from "./shapeLabel";
import { setArrowEndpoints, sceneEndpoints } from "./arrowEndpoints";

// Arrow <-> shape binding (eraser.io style). An arrow endpoint can be "bound" to
// a shape by that shape's stable id; when the shape moves or resizes we re-route
// the arrow so the bound end stays glued to the shape's border, facing the other
// end. The re-route funnels through setArrowEndpoints (utils/arrowEndpoints), the
// single arrow-layout entry point.
//
// Bindings live as three persisted fields (see enableBindingPersistence):
//   shape.id                      — stable identity for a binding target
//   arrow.startBinding / .endBinding — the bound shape's id (or undefined)

// --- stable ids -----------------------------------------------------------
let counter = 0;
const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `wb-${Math.random().toString(36).slice(2)}-${(counter += 1)}`;

export const ensureId = (obj) => {
  if (!obj.id) obj.id = genId();
  return obj.id;
};

// A shape that can be a binding target: anything that isn't an arrow, a bare
// line, or loose text. Rects/ellipses/diamonds/polygons, labelled shapes and
// imported icons (groups) all qualify.
const NON_BINDABLE = new Set(["line", "i-text", "text", "textbox"]);
export const isBindable = (o) =>
  !!o && !o.__nonBindable && !isArrow(o) && !NON_BINDABLE.has(o.type);

// How far outside a shape an arrow endpoint can land and still bind. People draw
// arrows TO a box's edge (or just past it), not deep inside — without this slack
// the endpoint misses the bbox and nothing binds. The bound end then snaps to
// the border anyway (rerouteArrow), so a little generosity here is free.
export const BIND_MARGIN = 24;

// --- geometry -------------------------------------------------------------
// The shape's absolute (scene) axis-aligned bounding box. Good enough for v1
// across rect/ellipse/diamond/polygon and labelled groups.
const sceneBBox = (shape) => shape.getBoundingRect(true, true);

const bboxContainsPoint = (shape, p, margin = 0) => {
  const b = sceneBBox(shape);
  return (
    p.x >= b.left - margin &&
    p.x <= b.left + b.width + margin &&
    p.y >= b.top - margin &&
    p.y <= b.top + b.height + margin
  );
};

// Point on the shape's border along the ray from its centre toward `toward`, so
// the arrow touches the actual outline (not the middle). Ellipses/circles use a
// true ray-ellipse intersection; everything else clips the ray to the bounding
// box (exact for rectangles; a close approximation for diamonds/polygons/icons).
export const borderPoint = (shape, toward) => {
  const c = shape.getCenterPoint();
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (dx === 0 && dy === 0) return { x: c.x, y: c.y };
  const b = sceneBBox(shape);
  const hw = b.width / 2;
  const hh = b.height / 2;
  const t =
    shape.type === "ellipse" || shape.type === "circle"
      ? // ray-ellipse: scale the direction so it lands exactly on the curve,
        // otherwise the tip stops on the bounding square and leaves a gap.
        1 / Math.hypot(dx / hw, dy / hh)
      : Math.min(
          dx === 0 ? Infinity : hw / Math.abs(dx),
          dy === 0 ? Infinity : hh / Math.abs(dy),
        );
  return { x: c.x + dx * t, y: c.y + dy * t };
};

// --- anchor (which point on the shape the arrow attaches to) --------------
// Store the attach point as a fraction of the shape's half-extents from its
// centre ({fx,fy} in [-1,1]). This is resolution-independent, so the arrow
// keeps attaching to the SAME side/corner as the shape moves or resizes —
// letting an arrow connect at any reachable border point, not just the centre.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const anchorOf = (shape, scenePoint) => {
  const c = shape.getCenterPoint();
  const b = sceneBBox(shape);
  return {
    fx: clamp((scenePoint.x - c.x) / (b.width / 2 || 1), -1, 1),
    fy: clamp((scenePoint.y - c.y) / (b.height / 2 || 1), -1, 1),
  };
};

// The scene point an anchor currently resolves to (centre + fraction*half).
const anchorTarget = (shape, anchor) => {
  const c = shape.getCenterPoint();
  const b = sceneBBox(shape);
  return {
    x: c.x + anchor.fx * (b.width / 2),
    y: c.y + anchor.fy * (b.height / 2),
  };
};

// --- lookups --------------------------------------------------------------
const shapeById = (canvas, id) =>
  id ? canvas.getObjects().find((o) => o.id === id) || null : null;

export const boundArrows = (canvas, shapeId) =>
  canvas
    .getObjects()
    .filter(
      (o) =>
        isArrow(o) && (o.startBinding === shapeId || o.endBinding === shapeId),
    );

// Current arrow endpoints in scene coords (delegates to the arrow-layout helper,
// which handles both a straight line and an elbow polyline connector).
const arrowEndpointsScene = (arrow) => sceneEndpoints(arrow);

// Scene position of one arrow end ("start" = tail, "end" = tip).
export const arrowEndScene = (arrow, end) => {
  const e = arrowEndpointsScene(arrow);
  return end === "start" ? e.tail : e.tip;
};

// --- re-route -------------------------------------------------------------
// Recompute one arrow's endpoints from its bindings. A bound end anchors to its
// shape's border (facing the other end); an unbound end keeps its position. A
// binding whose shape no longer exists is treated as unbound. Returns true if a
// bound end was re-routed.
export const rerouteArrow = (canvas, arrow) => {
  const startShape = shapeById(canvas, arrow.startBinding);
  const endShape = shapeById(canvas, arrow.endBinding);
  if (!startShape && !endShape) return false;

  const ends = arrowEndpointsScene(arrow);
  // Aim each bound end at its stored anchor point (so it keeps its attach
  // side/corner). A near-centre anchor is ambiguous, so fall back to facing the
  // other end — which snaps to a clean edge instead of burying it in the middle.
  const meaningful = (a) =>
    a && (Math.abs(a.fx) > 0.05 || Math.abs(a.fy) > 0.05);
  const startAim = startShape
    ? meaningful(arrow.startAnchor)
      ? anchorTarget(startShape, arrow.startAnchor)
      : endShape
        ? endShape.getCenterPoint()
        : ends.tip
    : null;
  const endAim = endShape
    ? meaningful(arrow.endAnchor)
      ? anchorTarget(endShape, arrow.endAnchor)
      : startShape
        ? startShape.getCenterPoint()
        : ends.tail
    : null;

  const tail = startShape ? borderPoint(startShape, startAim) : ends.tail;
  const tip = endShape ? borderPoint(endShape, endAim) : ends.tip;

  setArrowEndpoints(arrow, tail, tip);
  return true;
};

// --- bind on draw ---------------------------------------------------------
// Topmost bindable shape whose bbox contains `point` (scene coords), skipping
// `exclude` (a single object or an array — e.g. the arrow being drawn plus its
// transient preview line/head, which must not count as binding targets).
export const shapeUnderPoint = (canvas, point, exclude) => {
  const skip = Array.isArray(exclude) ? exclude : exclude ? [exclude] : [];
  const objs = canvas.getObjects();
  for (let i = objs.length - 1; i >= 0; i -= 1) {
    const o = objs[i];
    if (skip.includes(o) || !isBindable(o)) continue;
    if (bboxContainsPoint(o, point, BIND_MARGIN)) return o;
  }
  return null;
};

// Field names for an end ("start" = tail/e1, "end" = tip/e2).
const bindingField = (end) => (end === "start" ? "startBinding" : "endBinding");
const anchorField = (end) => (end === "start" ? "startAnchor" : "endAnchor");

// Bind one end of an arrow to a shape, anchoring at where the endpoint landed.
export const bindEnd = (arrow, end, shape, scenePoint) => {
  arrow[bindingField(end)] = ensureId(shape);
  arrow[anchorField(end)] = anchorOf(shape, scenePoint);
  ensureId(arrow);
};

// Unbind one end (e.g. its endpoint was dragged into empty space).
export const unbindEnd = (arrow, end) => {
  arrow[bindingField(end)] = undefined;
  arrow[anchorField(end)] = undefined;
};

// After an arrow is drawn, bind whichever end landed on a shape (anchored at the
// drawn point) and snap it to the border. tailScene/tipScene are the draw ends.
export const bindArrowOnDraw = (canvas, arrow, tailScene, tipScene) => {
  const startShape = shapeUnderPoint(canvas, tailScene, arrow);
  const endShape = shapeUnderPoint(canvas, tipScene, arrow);
  if (startShape) bindEnd(arrow, "start", startShape, tailScene);
  if (endShape) bindEnd(arrow, "end", endShape, tipScene);
  if (startShape || endShape) rerouteArrow(canvas, arrow);
  return { startShape, endShape };
};

// --- persistence ----------------------------------------------------------
// Serialise the binding fields on every object so bindings survive reload and
// undo/redo (both go through toObject/loadFromJSON). Idempotent.
export const enableBindingPersistence = () => {
  if (fabric.__bindingPersist) return;
  fabric.__bindingPersist = true;
  const base = fabric.Object.prototype.toObject;
  fabric.Object.prototype.toObject = function (propertiesToInclude) {
    return base.call(this, [
      "id",
      "startBinding",
      "endBinding",
      "startAnchor",
      "endAnchor",
      ...(propertiesToInclude || []),
    ]);
  };
};
