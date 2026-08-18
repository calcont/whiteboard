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

// The arrowhead PATH ("M 0 0 L 20 10 L 0 20 Z") has its tip vertex half its
// length ahead of the path's centre. Placing the centre AT the endpoint makes the
// visible tip overshoot by that much — and, when the end is bound to a shape,
// poke inside it. HEAD_TIP_INSET is that half-length; headCenterFor returns where
// the head's centre must sit (backed off along the incoming segment prev->tip) so
// the tip lands exactly on `tip`.
export const HEAD_TIP_INSET = 10;
export const headCenterFor = (tip, prev) => {
  const dx = tip.x - prev.x;
  const dy = tip.y - prev.y;
  const len = Math.hypot(dx, dy);
  if (!len) return { x: tip.x, y: tip.y };
  return {
    x: tip.x - (dx / len) * HEAD_TIP_INSET,
    y: tip.y - (dy / len) * HEAD_TIP_INSET,
  };
};

// The scene/group-local point of a head's visible tip vertex, from its centre
// (left/top) and angle. The logical arrow endpoint for a headed end IS this tip
// (the connector line stops short at the head centre — see applyEndpointsLocal —
// so it never poked past the head's narrowing point).
export const headTipOf = (head) => {
  const a = (head.angle * Math.PI) / 180;
  return {
    x: head.left + HEAD_TIP_INSET * Math.cos(a),
    y: head.top + HEAD_TIP_INSET * Math.sin(a),
  };
};

// Orthogonal (elbow) route between two points: a right-angled path. Routes along
// the dominant axis first, bending at the midpoint (a clean Z). Collapses to a
// straight segment when the points share a row/column.
export const elbowRoute = (s, e) => {
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  if (Math.abs(dx) < 1 || Math.abs(dy) < 1)
    return [
      { x: s.x, y: s.y },
      { x: e.x, y: e.y },
    ];
  if (Math.abs(dx) >= Math.abs(dy)) {
    const mx = s.x + dx / 2;
    return [
      { x: s.x, y: s.y },
      { x: mx, y: s.y },
      { x: mx, y: e.y },
      { x: e.x, y: e.y },
    ];
  }
  const my = s.y + dy / 2;
  return [
    { x: s.x, y: s.y },
    { x: s.x, y: my },
    { x: e.x, y: my },
    { x: e.x, y: e.y },
  ];
};

// Position an elbow polyline so its points render at their exact group-local
// coords (fabric otherwise offsets a polyline by its pathOffset). Set the route,
// recompute dimensions, then pin left/top to the new pathOffset.
export const layoutElbowPolyline = (poly, route) => {
  poly.set({ points: route.map((p) => ({ x: p.x, y: p.y })) });
  poly._setPositionDimensions({});
  poly.set({ left: poly.pathOffset.x, top: poly.pathOffset.y });
  poly.setCoords();
};

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
// For an end that carries a head, the logical endpoint is the head's TIP vertex
// (the visible point), NOT the connector's terminal — the connector is drawn
// short of the tip so it doesn't poke through. heads[0] = tip end (e2),
// heads[1] = tail end (e1) on a double-headed arrow.
const localEndpoints = (group) => {
  const { line, heads } = getArrowParts(group);
  let e1;
  let e2;
  if (line.type === "polyline") {
    // Elbow: points already live in group-local coords (see layoutElbowPolyline).
    const pts = line.points;
    e1 = { x: pts[0].x, y: pts[0].y };
    e2 = { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
  } else {
    const lp = line.calcLinePoints();
    e1 = { x: line.left + lp.x1, y: line.top + lp.y1 }; // tail (line start)
    e2 = { x: line.left + lp.x2, y: line.top + lp.y2 }; // tip (line end)
  }
  if (heads[0]) e2 = headTipOf(heads[0]);
  if (heads[1]) e1 = headTipOf(heads[1]);
  return { e1, e2 };
};

// Arrow endpoints in absolute (scene) coords — handles line or elbow polyline.
export const sceneEndpoints = (group) => {
  const { e1, e2 } = localEndpoints(group);
  const m = group.calcTransformMatrix();
  const toScene = (p) =>
    fabric.util.transformPoint(new fabric.Point(p.x, p.y), m);
  return { tail: toScene(e1), tip: toScene(e2) };
};

// The single source of truth for arrow layout: rewrite the line, head(s) and
// label to a straight segment between `start` and `end`, both in GROUP-LOCAL
// coords (relative to the group centre, which is left unchanged so children
// keep rendering). All endpoint mutations funnel through here.
const applyEndpointsLocal = (group, start, end) => {
  const { line, heads, text } = getArrowParts(group);
  const elbow = line.type === "polyline";

  // The route the head/label follow: a straight [start,end] or the elbow path.
  const route = elbow ? elbowRoute(start, end) : [start, end];

  // heads[0] sits at the tip, aimed along the LAST segment; a second head
  // (double-ended) sits at the tail, aimed along the FIRST segment (reversed).
  // The head's CENTRE is backed off so its tip vertex lands exactly on the
  // endpoint. The CONNECTOR then stops at that centre (not the tip), so the line
  // is fully hidden under the head and never pokes past its narrowing point.
  const tipPrev = route[route.length - 2];
  const headEnd = heads[0] ? headCenterFor(end, tipPrev) : null;
  const headStart = heads[1] ? headCenterFor(start, route[1]) : null;
  if (heads[0]) {
    heads[0].set({
      left: headEnd.x,
      top: headEnd.y,
      angle: angleDeg(tipPrev, end),
    });
    heads[0].setCoords();
  }
  if (heads[1]) {
    heads[1].set({
      left: headStart.x,
      top: headStart.y,
      angle: angleDeg(route[1], start),
    });
    heads[1].setCoords();
  }

  // Connector route: same shape, but each headed end pulled in to the head centre.
  const cStart = headStart || start;
  const cEnd = headEnd || end;
  if (elbow) {
    const croute = route.map((p) => ({ x: p.x, y: p.y }));
    croute[0] = cStart;
    croute[croute.length - 1] = cEnd;
    layoutElbowPolyline(line, croute);
  } else {
    line.set({ x1: cStart.x, y1: cStart.y, x2: cEnd.x, y2: cEnd.y });
    line._setWidthHeight(); // re-derives the line's centre + bbox from the points
    line.setCoords();
  }
  if (text) {
    // Straight: segment midpoint. Elbow: the middle vertex of the route.
    const mid = elbow
      ? route[Math.floor(route.length / 2)]
      : { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    text.set({ left: mid.x, top: mid.y });
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

// e1 = tail = the arrow's "start" end; e2 = tip = the "end" end.
const endOf = (key) => (key === "e1" ? "start" : "end");

const actionHandler = (key) =>
  function (eventData, transform, x, y) {
    const group = transform.target;
    const inv = fabric.util.invertTransform(screenMatrix(group));
    const local = fabric.util.transformPoint(new fabric.Point(x, y), inv);
    reshapeArrow(group, key, local);
    // Let binding react live (highlight the shape under the dragged endpoint).
    if (group.canvas)
      group.canvas.fire("arrow:endpoint:moving", {
        arrow: group,
        end: endOf(key),
      });
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
      const group = transform.target;
      refitArrowBounds(group);
      // Commit binding: bind if dropped on a shape, unbind if in empty space.
      if (group.canvas)
        group.canvas.fire("arrow:endpoint:up", {
          arrow: group,
          end: endOf(key),
        });
      return true;
    },
  });

// Replace an arrow group's default (bounding-box) controls with the two
// endpoint handles. Called from buildArrowGroup so every arrow gets them.
export const attachEndpointControls = (group) => {
  group.controls = { e1: makeControl("e1"), e2: makeControl("e2") };
  group.hasBorders = false; // no bbox outline — just the two endpoint dots
};
