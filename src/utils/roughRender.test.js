import { fabric } from "fabric";
import { enableRoughRendering } from "./roughRender";

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
