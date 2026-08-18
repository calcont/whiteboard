import { fabric } from "fabric";
import {
  reshapeArrow,
  refitArrowBounds,
  setArrowEndpoints,
  elbowRoute,
  headCenterFor,
} from "./arrowEndpoints";
import { getArrowParts, isArrow, isElbowArrow } from "./shapeLabel";
import { buildArrowGroup } from "../Handlers/ToolsHandler/tools/arrow";

describe("elbowRoute (orthogonal routing)", () => {
  test("mostly-horizontal points bend at the mid-x (H then V then H)", () => {
    const r = elbowRoute({ x: 0, y: 0 }, { x: 200, y: 60 });
    expect(r).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 60 },
      { x: 200, y: 60 },
    ]);
    // every segment is axis-aligned (a right angle at each bend)
    for (let i = 1; i < r.length; i += 1)
      expect(r[i].x === r[i - 1].x || r[i].y === r[i - 1].y).toBe(true);
  });

  test("mostly-vertical points bend at the mid-y", () => {
    const r = elbowRoute({ x: 0, y: 0 }, { x: 60, y: 200 });
    expect(r[1]).toEqual({ x: 0, y: 100 });
    expect(r[2]).toEqual({ x: 60, y: 100 });
  });

  test("aligned points collapse to a straight two-point segment", () => {
    expect(elbowRoute({ x: 0, y: 0 }, { x: 200, y: 0 })).toHaveLength(2);
  });
});

describe("headCenterFor (arrowhead sits ON the endpoint, not past it)", () => {
  test("backs the centre off the tip by the head half-length, along the segment", () => {
    // horizontal segment (0,0)->(100,0): centre pulled 10 left of the tip
    expect(headCenterFor({ x: 100, y: 0 }, { x: 0, y: 0 })).toEqual({
      x: 90,
      y: 0,
    });
  });

  test("normalises diagonal segments (offset magnitude stays the head length)", () => {
    const c = headCenterFor({ x: 30, y: 40 }, { x: 0, y: 0 }); // 3-4-5 => len 50
    expect(Math.round(c.x)).toBe(24); // 30 - (30/50)*10
    expect(Math.round(c.y)).toBe(32); // 40 - (40/50)*10
  });

  test("degenerate (tip == prev) returns the tip unchanged (no divide-by-zero)", () => {
    expect(headCenterFor({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({
      x: 5,
      y: 5,
    });
  });
});

describe("isElbowArrow", () => {
  test("true for an elbow arrow, false for a straight one", () => {
    const straight = buildArrowGroup(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { stroke: "#000", strokeWidth: 2, arrowType: "straight" },
    );
    const elbow = buildArrowGroup(
      { x: 0, y: 0 },
      { x: 200, y: 120 },
      { stroke: "#000", strokeWidth: 2, arrowType: "elbow" },
    );
    expect(isElbowArrow(straight)).toBe(false);
    expect(isElbowArrow(elbow)).toBe(true);
    expect(isArrow(elbow)).toBe(true); // an elbow is still an arrow
  });
});

const arrow = (label) =>
  buildArrowGroup(
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { stroke: "#000", strokeWidth: 2, ...(label ? { label } : {}) },
  );

// Endpoint positions in group-local coords (relative to the group centre).
const localEnds = (a) => {
  const { line } = getArrowParts(a);
  const lp = line.calcLinePoints();
  return {
    e1: { x: line.left + lp.x1, y: line.top + lp.y1 },
    e2: { x: line.left + lp.x2, y: line.top + lp.y2 },
  };
};

describe("reshapeArrow", () => {
  test("moves the dragged endpoint, keeps the other, follows head + label", () => {
    const a = arrow({ text: "x", fontSize: 16 });
    const before = localEnds(a);
    const target = { x: before.e2.x + 40, y: before.e2.y + 60 };

    reshapeArrow(a, "e2", target);

    const after = localEnds(a);
    // tip moved to the target, tail unchanged
    expect(Math.round(after.e2.x)).toBe(Math.round(target.x));
    expect(Math.round(after.e2.y)).toBe(Math.round(target.y));
    expect(Math.round(after.e1.x)).toBe(Math.round(before.e1.x));
    expect(Math.round(after.e1.y)).toBe(Math.round(before.e1.y));

    const { heads, text } = getArrowParts(a);
    // single head is backed off the tip so its VISIBLE point lands on the tip
    // (its centre is HEAD_TIP_INSET back along the tail->tip segment).
    const cen = headCenterFor(target, after.e1);
    expect(Math.round(heads[0].left)).toBe(Math.round(cen.x));
    expect(Math.round(heads[0].top)).toBe(Math.round(cen.y));
    // label re-centres on the new midpoint
    expect(Math.round(text.left)).toBe(Math.round((after.e1.x + target.x) / 2));
    expect(Math.round(text.top)).toBe(Math.round((after.e1.y + target.y) / 2));
  });

  test("dragging the tail moves e1 and leaves the tip put", () => {
    const a = arrow();
    const before = localEnds(a);
    const target = { x: before.e1.x - 30, y: before.e1.y - 20 };
    reshapeArrow(a, "e1", target);
    const after = localEnds(a);
    expect(Math.round(after.e1.x)).toBe(Math.round(target.x));
    expect(Math.round(after.e2.x)).toBe(Math.round(before.e2.x));
  });

  test("the reshaped group is still a valid arrow", () => {
    const a = arrow();
    reshapeArrow(a, "e2", { x: 40, y: 90 });
    expect(isArrow(a)).toBe(true);
  });
});

describe("refitArrowBounds", () => {
  test("re-fits bounds without shifting the endpoints' absolute positions", () => {
    const c = new fabric.Canvas(document.createElement("canvas"));
    const a = arrow();
    c.add(a);
    const P = fabric.Point;
    const abs = (k) => {
      const { line } = getArrowParts(a);
      const lp = line.calcLinePoints();
      const off = k === "e1" ? { x: lp.x1, y: lp.y1 } : { x: lp.x2, y: lp.y2 };
      return fabric.util.transformPoint(
        new P(line.left + off.x, line.top + off.y),
        a.calcTransformMatrix(),
      );
    };
    reshapeArrow(a, "e2", { x: 60, y: 120 }); // extend well past the old bbox
    const tipBefore = abs("e2");
    const tailBefore = abs("e1");

    refitArrowBounds(a);

    const tipAfter = abs("e2");
    const tailAfter = abs("e1");
    // absolute positions preserved through the re-fit (within rounding)
    expect(Math.round(tipAfter.x)).toBe(Math.round(tipBefore.x));
    expect(Math.round(tipAfter.y)).toBe(Math.round(tipBefore.y));
    expect(Math.round(tailAfter.x)).toBe(Math.round(tailBefore.x));
    expect(Math.round(tailAfter.y)).toBe(Math.round(tailBefore.y));
    expect(a.scaleX).toBe(1);
  });
});

describe("setArrowEndpoints (programmatic re-route)", () => {
  test("sets both endpoints from scene coords and stays an arrow", () => {
    const c = new fabric.Canvas(document.createElement("canvas"));
    const a = arrow();
    c.add(a);

    setArrowEndpoints(a, { x: 40, y: 40 }, { x: 240, y: 180 });

    const P = fabric.Point;
    const abs = (k) => {
      const { line } = getArrowParts(a);
      const lp = line.calcLinePoints();
      const off = k === "e1" ? { x: lp.x1, y: lp.y1 } : { x: lp.x2, y: lp.y2 };
      return fabric.util.transformPoint(
        new P(line.left + off.x, line.top + off.y),
        a.calcTransformMatrix(),
      );
    };
    const tail = abs("e1");
    const tip = abs("e2");
    expect(Math.round(tail.x)).toBe(40);
    expect(Math.round(tail.y)).toBe(40);
    expect(Math.round(tip.x)).toBe(240);
    expect(Math.round(tip.y)).toBe(180);
    expect(isArrow(a)).toBe(true);
  });
});
