import { Cylinder } from "./cylinder";
import { isBindable } from "../../../utils/binding";

// Minimal canvas stub: the tool only needs getPointer + add.
const mockCanvas = () => {
  const objects = [];
  return {
    objects,
    add: (o) => objects.push(o),
    getPointer: (e) => ({ x: e.clientX, y: e.clientY }),
  };
};
const evt = (x, y) => ({ e: { clientX: x, clientY: y } });

const drawCylinder = (from, to) => {
  const canvas = mockCanvas();
  const tool = new Cylinder();
  tool.create(canvas, evt(from.x, from.y));
  tool.draw(canvas, evt(to.x, to.y));
  tool.done(canvas);
  return { canvas, shape: canvas.objects[0] };
};

describe("Cylinder tool", () => {
  test("drag-to-size builds a path sized to the drag box", () => {
    const { shape } = drawCylinder({ x: 100, y: 100 }, { x: 260, y: 300 });
    expect(shape.type).toBe("path");
    expect(Math.round(shape.width)).toBe(160);
    expect(Math.round(shape.height)).toBe(200);
    expect(Math.round(shape.left)).toBe(100);
    expect(Math.round(shape.top)).toBe(100);
  });

  test("dragging up/left still sizes from the top-left corner", () => {
    const { shape } = drawCylinder({ x: 300, y: 300 }, { x: 200, y: 220 });
    expect(Math.round(shape.left)).toBe(200);
    expect(Math.round(shape.top)).toBe(220);
    expect(Math.round(shape.width)).toBe(100);
    expect(Math.round(shape.height)).toBe(80);
  });

  test("a plain click (no drag) drops a default-sized cylinder", () => {
    const { shape } = drawCylinder({ x: 50, y: 50 }, { x: 51, y: 51 });
    expect(shape.width).toBeGreaterThan(10);
    expect(shape.height).toBeGreaterThan(10);
  });

  test("the cylinder is a bindable shape (arrows can attach to it)", () => {
    const { shape } = drawCylinder({ x: 0, y: 0 }, { x: 120, y: 120 });
    expect(isBindable(shape)).toBe(true);
  });
});
