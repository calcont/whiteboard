import { fabric } from "fabric";
import {
  ensureId,
  isBindable,
  borderPoint,
  boundArrows,
  shapeUnderPoint,
  rerouteArrow,
  bindArrowOnDraw,
  enableBindingPersistence,
  BIND_MARGIN,
} from "./binding";
import { getArrowParts } from "./shapeLabel";
import { buildArrowGroup } from "../Handlers/ToolsHandler/tools/arrow";

const makeCanvas = () => new fabric.Canvas(document.createElement("canvas"));
// strokeWidth 0 so the bounding box is exactly width x height (getBoundingRect
// otherwise adds the stroke, which would shift the border-point math by 0.5px).
const rect = (o = {}) =>
  new fabric.Rect({
    width: 100,
    height: 60,
    left: 0,
    top: 0,
    strokeWidth: 0,
    ...o,
  });
const arrow = (start, end) =>
  buildArrowGroup(start, end, { stroke: "#111", strokeWidth: 2, heads: "end" });

// Tail/tip of an arrow in scene coords (mirrors the module's internal helper).
const ends = (a) => {
  const { line } = getArrowParts(a);
  const lp = line.calcLinePoints();
  const m = a.calcTransformMatrix();
  const p = (x, y) =>
    fabric.util.transformPoint(
      new fabric.Point(line.left + x, line.top + y),
      m,
    );
  return { tail: p(lp.x1, lp.y1), tip: p(lp.x2, lp.y2) };
};

describe("ensureId", () => {
  test("assigns a stable id and is idempotent", () => {
    const r = rect();
    const id = ensureId(r);
    expect(id).toBeTruthy();
    expect(ensureId(r)).toBe(id);
  });
});

describe("isBindable", () => {
  test("shapes and groups are bindable; arrows, lines and text are not", () => {
    expect(isBindable(rect())).toBe(true);
    expect(isBindable(new fabric.Ellipse({ rx: 20, ry: 10 }))).toBe(true);
    expect(isBindable(arrow({ x: 0, y: 0 }, { x: 50, y: 0 }))).toBe(false);
    expect(isBindable(new fabric.Line([0, 0, 10, 0]))).toBe(false);
    expect(isBindable(new fabric.IText("x"))).toBe(false);
  });
});

describe("borderPoint", () => {
  test("clips the centre->toward ray to the shape's bounding box edge", () => {
    const r = rect({ left: 50, top: 70 }); // centre (100,100), hw 50, hh 30
    // toward the right -> right edge centre (150, 100)
    expect(borderPoint(r, { x: 400, y: 100 })).toEqual({ x: 150, y: 100 });
    // straight up -> top edge centre (100, 70)
    expect(borderPoint(r, { x: 100, y: -100 })).toEqual({ x: 100, y: 70 });
  });
});

describe("shapeUnderPoint", () => {
  test("returns the topmost bindable shape containing the point, else null", () => {
    const c = makeCanvas();
    const r = rect({ left: 50, top: 50 }); // covers (50,50)-(150,110)
    c.add(r);
    expect(shapeUnderPoint(c, { x: 100, y: 80 })).toBe(r);
    expect(shapeUnderPoint(c, { x: 500, y: 500 })).toBe(null);
  });

  test("skips the excluded object (the arrow being drawn)", () => {
    const c = makeCanvas();
    const r = rect({ left: 50, top: 50 });
    c.add(r);
    expect(shapeUnderPoint(c, { x: 100, y: 80 }, r)).toBe(null);
  });

  test("binds to a point just outside the edge (within BIND_MARGIN)", () => {
    const c = makeCanvas();
    const r = rect({ left: 50, top: 50 }); // right edge x=150
    c.add(r);
    // people draw arrows TO the edge; a point a few px past it still binds
    expect(shapeUnderPoint(c, { x: 150 + BIND_MARGIN - 4, y: 80 })).toBe(r);
    // but well beyond the margin does not
    expect(shapeUnderPoint(c, { x: 150 + BIND_MARGIN + 20, y: 80 })).toBe(null);
  });
});

describe("boundArrows", () => {
  test("finds arrows bound to a shape by id on either end", () => {
    const c = makeCanvas();
    const r = rect();
    ensureId(r);
    const a1 = arrow({ x: 0, y: 0 }, { x: 50, y: 0 });
    a1.startBinding = r.id;
    const a2 = arrow({ x: 0, y: 0 }, { x: 50, y: 0 });
    a2.endBinding = r.id;
    const a3 = arrow({ x: 0, y: 0 }, { x: 50, y: 0 }); // unbound
    c.add(r, a1, a2, a3);
    expect(boundArrows(c, r.id).sort()).toEqual([a1, a2].sort());
  });
});

describe("rerouteArrow", () => {
  test("snaps a bound end to the shape's border facing the other end", () => {
    const c = makeCanvas();
    const r = rect({ left: 50, top: 270 }); // centre (100,300), right edge x=150
    ensureId(r);
    const a = arrow({ x: 500, y: 300 }, { x: 700, y: 300 });
    a.startBinding = r.id;
    c.add(r, a);

    expect(rerouteArrow(c, a)).toBe(true);
    const { tail, tip } = ends(a);
    // tail snapped to the rect's right edge; tip (unbound) stays put
    expect(Math.round(tail.x)).toBe(150);
    expect(Math.round(tail.y)).toBe(300);
    expect(Math.round(tip.x)).toBe(700);
  });

  test("returns false when neither end is bound", () => {
    const c = makeCanvas();
    const a = arrow({ x: 0, y: 0 }, { x: 50, y: 0 });
    c.add(a);
    expect(rerouteArrow(c, a)).toBe(false);
  });
});

describe("bindArrowOnDraw", () => {
  test("binds the ends dropped on shapes and snaps them to the border", () => {
    const c = makeCanvas();
    const a = rect({ left: 50, top: 270 }); // centre (100,300)
    const b = rect({ left: 650, top: 270 }); // centre (700,300)
    c.add(a, b);
    const ar = arrow({ x: 100, y: 300 }, { x: 700, y: 300 });
    c.add(ar);

    const res = bindArrowOnDraw(c, ar, { x: 100, y: 300 }, { x: 700, y: 300 });
    expect(res.startShape).toBe(a);
    expect(res.endShape).toBe(b);
    expect(ar.startBinding).toBe(a.id);
    expect(ar.endBinding).toBe(b.id);
    const { tail, tip } = ends(ar);
    expect(Math.round(tail.x)).toBe(150); // a's right edge
    expect(Math.round(tip.x)).toBe(650); // b's left edge
  });

  test("leaves an arrow drawn in empty space unbound", () => {
    const c = makeCanvas();
    const ar = arrow({ x: 10, y: 10 }, { x: 200, y: 10 });
    c.add(ar);
    bindArrowOnDraw(c, ar, { x: 10, y: 10 }, { x: 200, y: 10 });
    expect(ar.startBinding).toBeUndefined();
    expect(ar.endBinding).toBeUndefined();
  });
});

describe("enableBindingPersistence", () => {
  test("serialises id / startBinding / endBinding on toObject", () => {
    enableBindingPersistence();
    const r = rect();
    r.id = "shape-1";
    const a = arrow({ x: 0, y: 0 }, { x: 50, y: 0 });
    a.id = "arrow-1";
    a.startBinding = "shape-1";
    expect(r.toObject().id).toBe("shape-1");
    expect(a.toObject().startBinding).toBe("shape-1");
    expect(a.toObject().id).toBe("arrow-1");
  });
});
