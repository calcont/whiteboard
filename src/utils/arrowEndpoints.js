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

// Drop duplicate and collinear points so a route is the minimal set of corners
// (keeps roundRoute from filleting non-corners, and elbows from kinking).
const cleanRoute = (pts) => {
  const dedup = [];
  pts.forEach((p) => {
    const last = dedup[dedup.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.5 && Math.abs(last.y - p.y) < 0.5)
      return;
    dedup.push({ x: p.x, y: p.y });
  });
  if (dedup.length <= 2) return dedup;
  const out = [dedup[0]];
  for (let i = 1; i < dedup.length - 1; i += 1) {
    const a = dedup[i - 1];
    const b = dedup[i];
    const c = dedup[i + 1];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) < 1e-6) continue; // collinear -> drop the middle point
    out.push(b);
  }
  out.push(dedup[dedup.length - 1]);
  return out;
};

// The dominant axis direction from `from` toward `to`, as an axis unit vector.
const axisToward = (from, to) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.abs(dx) >= Math.abs(dy)
    ? { x: Math.sign(dx) || 1, y: 0 }
    : { x: 0, y: Math.sign(dy) || 1 };
};

// The plain dominant-axis mid-bend Z — used when no port directions are known
// (a free-drawn elbow, or a live endpoint drag).
const simpleElbow = (s, e) => {
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

// Smart orthogonal route between two PORTS — a point plus the axis direction the
// path must leave it by (the outward normal of the shape edge it's bound to). It
// stubs out perpendicular to each edge, then connects the stubs with a clean
// right-angled path, so the arrow leaves/enters each shape square-on (the
// eraser.io/Excalidraw look) instead of cutting diagonally to a mid-point.
const STUB = 22;
const smartElbow = (s, ds, e, de) => {
  const dist = Math.hypot(e.x - s.x, e.y - s.y);
  const m = Math.min(STUB, Math.max(6, dist * 0.4));
  const a = { x: s.x + ds.x * m, y: s.y + ds.y * m };
  const b = { x: e.x + de.x * m, y: e.y + de.y * m };
  const aH = ds.x !== 0;
  const bH = de.x !== 0;
  const mid = [];
  if (aH && bH) {
    const facing =
      Math.sign(b.x - a.x) === ds.x && Math.sign(a.x - b.x) === de.x;
    if (facing) {
      const mx = (a.x + b.x) / 2;
      mid.push({ x: mx, y: a.y }, { x: mx, y: b.y });
    } else {
      const my = (a.y + b.y) / 2;
      mid.push({ x: a.x, y: my }, { x: b.x, y: my });
    }
  } else if (!aH && !bH) {
    const facing =
      Math.sign(b.y - a.y) === ds.y && Math.sign(a.y - b.y) === de.y;
    if (facing) {
      const my = (a.y + b.y) / 2;
      mid.push({ x: a.x, y: my }, { x: b.x, y: my });
    } else {
      const mx = (a.x + b.x) / 2;
      mid.push({ x: mx, y: a.y }, { x: mx, y: b.y });
    }
  } else if (aH) {
    mid.push({ x: b.x, y: a.y }); // A horizontal, B vertical -> one corner
  } else {
    mid.push({ x: a.x, y: b.y }); // A vertical, B horizontal -> one corner
  }
  return cleanRoute([s, a, ...mid, b, e]);
};

// Orthogonal (elbow) route between two points. With port directions (ds/de — the
// outward edge normals of bound shapes) it routes smartly with perpendicular
// exits; without them it falls back to the plain dominant-axis mid-bend. A
// missing single direction is derived from the geometry.
export const elbowRoute = (s, e, ds, de) => {
  if (!ds && !de) return simpleElbow(s, e);
  return smartElbow(s, ds || axisToward(s, e), e, de || axisToward(e, s));
};

// Radius of the rounded corners on an elbow arrow (eraser.io/Excalidraw style).
export const ELBOW_CORNER_RADIUS = 12;

// Expand a sharp orthogonal route into one with ROUNDED corners: each interior
// vertex becomes a short quadratic-bezier fillet (the corner is the control
// point), approximated by a few points so the plain polyline renders as a smooth
// rounded elbow. The FIRST and LAST points are left exactly on the endpoints, so
// localEndpoints (which reads points[0]/points[last]) is unaffected. The fillet
// radius is capped to half the shorter adjacent segment so short legs don't kink.
const roundRoute = (route, radius) => {
  if (route.length <= 2) return route.map((p) => ({ x: p.x, y: p.y }));
  const out = [{ x: route[0].x, y: route[0].y }];
  for (let i = 1; i < route.length - 1; i += 1) {
    const a = route[i - 1];
    const b = route[i];
    const c = route[i + 1];
    const v1 = { x: a.x - b.x, y: a.y - b.y };
    const v2 = { x: c.x - b.x, y: c.y - b.y };
    const l1 = Math.hypot(v1.x, v1.y) || 1;
    const l2 = Math.hypot(v2.x, v2.y) || 1;
    const r = Math.min(radius, l1 / 2, l2 / 2);
    if (r < 0.5) {
      out.push({ x: b.x, y: b.y });
      continue;
    }
    const p1 = { x: b.x + (v1.x / l1) * r, y: b.y + (v1.y / l1) * r };
    const p2 = { x: b.x + (v2.x / l2) * r, y: b.y + (v2.y / l2) * r };
    const steps = 4;
    out.push(p1);
    for (let s = 1; s < steps; s += 1) {
      const t = s / steps;
      const mt = 1 - t;
      out.push({
        x: mt * mt * p1.x + 2 * mt * t * b.x + t * t * p2.x,
        y: mt * mt * p1.y + 2 * mt * t * b.y + t * t * p2.y,
      });
    }
    out.push(p2);
  }
  out.push({ x: route[route.length - 1].x, y: route[route.length - 1].y });
  return out;
};

// Position an elbow polyline so its points render at their exact group-local
// coords (fabric otherwise offsets a polyline by its pathOffset). Round the
// route's corners, set the points, recompute dimensions, then pin left/top to
// the new pathOffset.
export const layoutElbowPolyline = (poly, route) => {
  poly.set({ points: roundRoute(route, ELBOW_CORNER_RADIUS) });
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

// Arrow's logical endpoints [tail, tip], group-local — the source of truth.
// Children are derived from it, never read back (read-back caused head drift).
export const ARROW_GEOM_FIELD = "arrowPoints";

// Migrate a pre-arrowPoints arrow (old board / undo snapshot) once.
const reconstructEndpointsFromChildren = (group) => {
  const { line, heads } = getArrowParts(group);
  let e1;
  let e2;
  if (line.type === "polyline") {
    const pts = line.points;
    e1 = { x: pts[0].x, y: pts[0].y };
    e2 = { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
  } else {
    const lp = line.calcLinePoints();
    e1 = { x: line.left + lp.x1, y: line.top + lp.y1 };
    e2 = { x: line.left + lp.x2, y: line.top + lp.y2 };
  }
  if (heads[0]) e2 = headTipOf(heads[0]);
  if (heads[1]) e1 = headTipOf(heads[1]);
  return { e1, e2 };
};

export const setLocalGeom = (group, e1, e2) => {
  group[ARROW_GEOM_FIELD] = [
    { x: e1.x, y: e1.y },
    { x: e2.x, y: e2.y },
  ];
};

// Reconstructs + caches on first read of a pre-arrowPoints arrow.
const getLocalGeom = (group) => {
  const pts = group[ARROW_GEOM_FIELD];
  if (Array.isArray(pts) && pts.length === 2) {
    return {
      e1: { x: pts[0].x, y: pts[0].y },
      e2: { x: pts[1].x, y: pts[1].y },
    };
  }
  const ends = reconstructEndpointsFromChildren(group);
  setLocalGeom(group, ends.e1, ends.e2);
  return ends;
};

const localEndpoints = (group) => getLocalGeom(group);

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
const applyEndpointsLocal = (group, start, end, presetRoute) => {
  const { line, heads, text } = getArrowParts(group);
  const elbow = line.type === "polyline";

  // Record the truth before deriving children from it.
  setLocalGeom(group, start, end);

  // The route the head/label follow. A caller (binding's obstacle-aware router)
  // may hand in a ready LOCAL route; otherwise a bound elbow uses its ports' exit
  // directions (startDir/endDir) for a perpendicular mid-bend, and a straight
  // arrow is just [start,end].
  const route =
    presetRoute && presetRoute.length >= 2
      ? presetRoute
      : elbow
        ? elbowRoute(start, end, group.startDir, group.endDir)
        : [start, end];

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
// (by default) re-fit its bounds. The programmatic entry point (e.g. a bound
// shape moving) — callers just say "put the ends here".
//
// Pass refit=false while the arrow ITSELF is being dragged: refitArrowBounds
// resets the group's left/top, which fabric then clobbers with its own
// translate each frame — leaving the geometry fighting the drag. Skipping the
// refit re-positions only the children (keeping a bound end glued to its border
// as the group translates); the bounds are re-fitted once on drop.
// sceneRoute (optional) is a full pre-computed orthogonal path in SCENE coords
// (from binding's obstacle-aware router); it's converted to local and used
// verbatim for the connector instead of the built-in mid-bend.
export const setArrowEndpoints = (
  group,
  tailScene,
  tipScene,
  refit = true,
  sceneRoute = null,
) => {
  const inv = fabric.util.invertTransform(group.calcTransformMatrix());
  const toLocal = (p) =>
    fabric.util.transformPoint(new fabric.Point(p.x, p.y), inv);
  const localRoute =
    sceneRoute && sceneRoute.length >= 2 ? sceneRoute.map(toLocal) : null;
  applyEndpointsLocal(group, toLocal(tailScene), toLocal(tipScene), localRoute);
  if (refit) refitArrowBounds(group);
};

// Re-fit the group's bounding box to its (mutated) children while preserving
// their on-screen positions — so per-pixel hit-testing and future moves are
// correct after an endpoint drag. Mirrors fabric's own addWithUpdate sequence:
// bake the current transform into the children (absolute coords), reset the
// group transform, then recompute the bounds and re-base the children. Skipping
// the restore/reset (as a naive _calcBounds does) shifts everything.
export const refitArrowBounds = (group) => {
  // Re-fit re-bases the local frame; pin the endpoints in scene space across it
  // (fabric re-bases children, but this stored data won't move itself).
  const before = getLocalGeom(group);
  const mBefore = group.calcTransformMatrix();
  const sceneE1 = fabric.util.transformPoint(
    new fabric.Point(before.e1.x, before.e1.y),
    mBefore,
  );
  const sceneE2 = fabric.util.transformPoint(
    new fabric.Point(before.e2.x, before.e2.y),
    mBefore,
  );

  group._restoreObjectsState();
  fabric.util.resetObjectTransform(group);
  group._calcBounds();
  group._updateObjectsCoords();
  group.setCoords();

  const inv = fabric.util.invertTransform(group.calcTransformMatrix());
  setLocalGeom(
    group,
    fabric.util.transformPoint(sceneE1, inv),
    fabric.util.transformPoint(sceneE2, inv),
  );
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
