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

test("stroke is a single rough pass (no doubled border) and rough draws no fill", () => {
  enableRoughRendering();
  setSketchyMode(true);
  const rect = new fabric.Rect({
    width: 100,
    height: 60,
    stroke: "#111",
    strokeWidth: 8,
    fill: "#a5d8ff",
  });
  rect._render(ctx());
  const sets = rect.__roughDrawable.sets;
  // rough draws ONLY the outline (we fill the exact geometry ourselves), and
  // that outline is a single pass — no doubled border, no bleeding fill.
  expect(sets.every((s) => s.type === "path")).toBe(true);
  const pathOps = sets.find((s) => s.type === "path").ops.length;
  expect(pathOps).toBeLessThanOrEqual(10); // single pass (~8), not ~16
});

describe("scale compensation (constant stroke/wobble at any size)", () => {
  test("a scaled rect regenerates its rough at the ON-SCREEN size", () => {
    enableRoughRendering();
    setSketchyMode(true);
    const rect = new fabric.Rect({
      width: 100,
      height: 60,
      stroke: "#111",
      strokeWidth: 3,
      scaleX: 2,
      scaleY: 2,
    });
    rect._render(ctx());
    // key encodes on-screen dims (100x60 * scale 2 = 200x120), NOT local 100x60,
    // so the drawable is traced big and the 1:1 ctx keeps the stroke constant.
    expect(rect.__roughKey.startsWith("200x120")).toBe(true);
  });

  test("a rect with rx traces the rounded-rect path (sketchy rounded corners)", () => {
    enableRoughRendering();
    setSketchyMode(true);
    const round = new fabric.Rect({ width: 120, height: 80, rx: 16, ry: 16 });
    const sharp = new fabric.Rect({ width: 120, height: 80 });
    round._render(ctx());
    sharp._render(ctx());
    // the radius is baked into the cache key, so the rounded rect takes the
    // gen.path(roundedRectPath) branch while the sharp one takes gen.rectangle.
    expect(round.__roughKey).toContain("r16x16");
    expect(sharp.__roughKey).toContain("r0x0");
    expect(round.__roughDrawable).toBeTruthy();
  });
});

describe("seed persistence (stable wobble across reload/undo)", () => {
  test("the rough seed is serialised in toObject so it can be restored", () => {
    enableRoughRendering();
    const rect = new fabric.Rect({ width: 40, height: 20 });
    rect.__roughSeed = 123456;
    expect(rect.toObject().__roughSeed).toBe(123456);
    // and a revived object carrying the seed keeps it (seedFor won't re-random)
    const revived = new fabric.Rect({
      width: 40,
      height: 20,
      __roughSeed: 777,
    });
    expect(revived.__roughSeed).toBe(777);
  });
});
