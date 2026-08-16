import { fabric } from "fabric";
import { reshapeArrow, refitArrowBounds } from "./arrowEndpoints";
import { getArrowParts, isArrow } from "./shapeLabel";
import { buildArrowGroup } from "../Handlers/ToolsHandler/tools/arrow";

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
    // single head sits at the tip
    expect(Math.round(heads[0].left)).toBe(Math.round(target.x));
    expect(Math.round(heads[0].top)).toBe(Math.round(target.y));
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
