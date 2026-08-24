import { fabric } from "fabric";
import * as dagre from "@dagrejs/dagre";
import { isArrow } from "./shapeLabel";
import { isBindable, boundArrows, rerouteArrow } from "./binding";

// Auto-layout ("Arrange"): tidy a bound diagram into a clean layered flow. The
// graph is read from the canvas — bindable shapes are nodes, arrows bound at
// BOTH ends are edges — laid out with dagre (the Sugiyama layout mermaid uses),
// then shapes are moved to their new spots and their arrows re-routed. This is
// also the layout the future IR->canvas render will reuse.

export const DEFAULT_LAYOUT = {
  rankdir: "TB", // top-to-bottom flow
  nodesep: 60, // gap between siblings in a rank
  ranksep: 90, // gap between ranks
};

// Read the diagram as a graph. Nodes = shapes that are an endpoint of at least
// one fully-bound arrow (so unconnected shapes are left untouched). Returns
// { nodes: [{id,w,h,cx,cy}], edges: [{from,to}] }.
export const extractGraph = (canvas) => {
  const byId = new Map();
  canvas.getObjects().forEach((o) => {
    if (o && o.id && isBindable(o)) byId.set(o.id, o);
  });
  const edges = [];
  const nodeIds = new Set();
  canvas.getObjects().forEach((o) => {
    if (!isArrow(o)) return;
    const from = o.startBinding;
    const to = o.endBinding;
    if (from && to && byId.has(from) && byId.has(to) && from !== to) {
      edges.push({ from, to });
      nodeIds.add(from);
      nodeIds.add(to);
    }
  });
  const nodes = [...nodeIds].map((id) => {
    const b = byId.get(id).getBoundingRect(true, true);
    return {
      id,
      w: b.width,
      h: b.height,
      cx: b.left + b.width / 2,
      cy: b.top + b.height / 2,
    };
  });
  return { nodes, edges };
};

// Pure layout: run dagre over the node/edge lists and return a Map of
// id -> { cx, cy } (new centres), translated so the result stays centred where
// the diagram already is (no jarring jump). Null when there's nothing to lay out.
export const layoutGraph = (nodes, edges, opts = {}) => {
  if (!nodes || nodes.length < 2 || !edges || !edges.length) return null;
  const cfg = { ...DEFAULT_LAYOUT, ...opts };
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: cfg.rankdir,
    nodesep: cfg.nodesep,
    ranksep: cfg.ranksep,
  });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: n.w, height: n.h }));
  edges.forEach((e) => {
    if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
  });
  dagre.layout(g);

  // Translate the laid-out graph so its centroid matches the diagram's current
  // centroid — keeps the arranged diagram roughly where the user had it.
  const laid = nodes
    .map((n) => ({ id: n.id, p: g.node(n.id) }))
    .filter((x) => x.p);
  if (!laid.length) return null;
  const avg = (arr, f) => arr.reduce((s, x) => s + f(x), 0) / arr.length;
  const oldCx = avg(nodes, (n) => n.cx);
  const oldCy = avg(nodes, (n) => n.cy);
  const newCx = avg(laid, (x) => x.p.x);
  const newCy = avg(laid, (x) => x.p.y);
  const dx = oldCx - newCx;
  const dy = oldCy - newCy;
  const out = new Map();
  laid.forEach((x) => out.set(x.id, { cx: x.p.x + dx, cy: x.p.y + dy }));
  return out;
};

// Apply an auto-layout to the canvas: move each connected shape to its new
// centre, re-route its bound arrows, and record a single undo step. Returns true
// if anything was arranged.
export const arrangeDiagram = (canvas, opts = {}) => {
  const { nodes, edges } = extractGraph(canvas);
  const positions = layoutGraph(nodes, edges, opts);
  if (!positions) return false;

  const canBatch = typeof canvas._historySaveAction === "function";
  if (canBatch) canvas.historyProcessing = true;
  try {
    positions.forEach((pos, id) => {
      const shape = canvas.getObjects().find((o) => o.id === id);
      if (!shape) return;
      shape.setPositionByOrigin(
        new fabric.Point(pos.cx, pos.cy),
        "center",
        "center",
      );
      shape.setCoords();
    });
    // Re-route every arrow touching a moved shape so connectors follow.
    const arrows = new Set();
    positions.forEach((_pos, id) =>
      boundArrows(canvas, id).forEach((a) => arrows.add(a)),
    );
    arrows.forEach((a) => rerouteArrow(canvas, a));
  } finally {
    if (canBatch) {
      canvas.historyProcessing = false;
      canvas._historySaveAction();
    }
  }
  canvas.requestRenderAll();
  return true;
};
