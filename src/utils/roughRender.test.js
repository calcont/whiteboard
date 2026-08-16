import { fabric } from "fabric";
import {
  enableRoughRendering,
  isSketchyMode,
  setSketchyMode,
} from "./roughRender";

const ctx = () =>
  new Proxy(
    {},
    {
      get: () => () => {},
      set: () => true,
    },
  );

test("enableRoughRendering installs overrides and is idempotent", () => {
  enableRoughRendering();
  expect(fabric.__roughEnabled).toBe(true);
  const first = fabric.Rect.prototype._render;
  enableRoughRendering(); // second call is a no-op
  expect(fabric.Rect.prototype._render).toBe(first);
});

test("basic shapes render via rough without throwing, and cache a drawable", () => {
  enableRoughRendering();
  const rect = new fabric.Rect({ width: 100, height: 60, fill: "#a5d8ff" });
  expect(() => rect._render(ctx())).not.toThrow();
  expect(rect.__roughDrawable).toBeTruthy();

  const ell = new fabric.Ellipse({ rx: 40, ry: 30, fill: "#b2f2bb" });
  expect(() => ell._render(ctx())).not.toThrow();

  const line = new fabric.Line([0, 0, 50, 0], { stroke: "#111" });
  expect(() => line._render(ctx())).not.toThrow();
});

test("Path is left crisp (not overridden) so logos + arrowheads stay sharp", () => {
  enableRoughRendering();
  // Path keeps fabric's own _render; only the basic shapes got the rough one.
  expect(fabric.Path.prototype._render).not.toBe(fabric.Rect.prototype._render);
});

describe("sketchy mode toggle", () => {
  afterEach(() => setSketchyMode(true)); // restore default for other tests

  test("defaults on, toggles, and persists to localStorage", () => {
    enableRoughRendering();
    setSketchyMode(false);
    expect(isSketchyMode()).toBe(false);
    expect(localStorage.getItem("wb-sketchy")).toBe("false");
    setSketchyMode(true);
    expect(isSketchyMode()).toBe(true);
    expect(localStorage.getItem("wb-sketchy")).toBe("true");
  });

  test("renders without throwing in both modes", () => {
    enableRoughRendering();
    const rect = new fabric.Rect({ width: 80, height: 50, fill: "#a5d8ff" });
    setSketchyMode(true);
    expect(() => rect._render(ctx())).not.toThrow();
    setSketchyMode(false); // crisp fallback (fabric's own render)
    expect(() => rect._render(ctx())).not.toThrow();
  });
});

test("dashed strokes are a single rough pass (no doubled dashes)", () => {
  enableRoughRendering();
  setSketchyMode(true);
  const solid = new fabric.Rect({ width: 100, height: 60, stroke: "#111" });
  const dashed = new fabric.Rect({
    width: 100,
    height: 60,
    stroke: "#111",
    strokeDashArray: [12, 8],
  });
  solid._render(ctx());
  dashed._render(ctx());
  const ops = (o) =>
    o.__roughDrawable.sets.find((s) => s.type === "path").ops.length;
  // multi-stroke solid draws the outline twice; dashed draws it once
  expect(ops(dashed)).toBeLessThan(ops(solid));
});
