import { fabric } from "fabric";
import rough from "roughjs";

// Excalidraw-style hand-drawn rendering. We swap the crisp _render of the basic
// shape primitives (rect / ellipse / polygon / line) for a rough.js version,
// WITHOUT changing their `type` — so labels, dark-mode fill adaptation, hit
// detection and reload all keep working. fabric.Path is deliberately left alone
// so imported brand logos AND arrowheads stay crisp.

const gen = rough.generator();
const ROUGHNESS = 1.1;

// Stable per-object seed so the wobble doesn't jitter every frame (rough with a
// fixed seed is deterministic). In-memory only; a reload re-wobbles, which is
// fine.
const seedFor = (obj) => {
  if (obj.__roughSeed == null) {
    obj.__roughSeed = Math.floor(Math.random() * 2 ** 31);
  }
  return obj.__roughSeed;
};

const hasFill = (f) => f && f !== "transparent" && f !== "none";

const optsFor = (obj) => ({
  seed: seedFor(obj),
  roughness: ROUGHNESS,
  stroke: obj.stroke || "transparent",
  strokeWidth: obj.strokeWidth || 1,
  fill: hasFill(obj.fill) ? obj.fill : undefined,
  fillStyle: "solid", // sketchy outline, solid fill (hachure is a later toggle)
});

// Cache the generated drawable; only regenerate when geometry/style changes.
const drawableFor = (obj, key, make) => {
  if (obj.__roughKey !== key) {
    obj.__roughDrawable = make();
    obj.__roughKey = key;
  }
  return obj.__roughDrawable;
};

const traceOps = (ctx, ops) => {
  ctx.beginPath();
  for (const { op, data } of ops) {
    if (op === "move") ctx.moveTo(data[0], data[1]);
    else if (op === "lineTo") ctx.lineTo(data[0], data[1]);
    else if (op === "bcurveTo")
      ctx.bezierCurveTo(data[0], data[1], data[2], data[3], data[4], data[5]);
  }
};

// Render a rough drawable's sets to an (already object-local) fabric context,
// honouring the object's stroke colour/width/dash.
const drawRough = (ctx, obj, drawable) => {
  const o = drawable.options;
  for (const set of drawable.sets) {
    traceOps(ctx, set.ops);
    if (set.type === "fillPath") {
      ctx.fillStyle = o.fill;
      ctx.fill();
    } else if (set.type === "path") {
      ctx.save();
      ctx.strokeStyle = o.stroke;
      ctx.lineWidth = o.strokeWidth;
      if (Array.isArray(obj.strokeDashArray))
        ctx.setLineDash(obj.strokeDashArray);
      ctx.stroke();
      ctx.restore();
    }
  }
};

export const enableRoughRendering = () => {
  if (fabric.__roughEnabled) return;
  fabric.__roughEnabled = true;

  fabric.Rect.prototype._render = function (ctx) {
    const w = this.width;
    const h = this.height;
    const key = `${w}x${h}:${this.fill}:${this.stroke}:${this.strokeWidth}:${this.__roughSeed}`;
    const d = drawableFor(this, key, () =>
      gen.rectangle(-w / 2, -h / 2, w, h, optsFor(this)),
    );
    drawRough(ctx, this, d);
  };

  fabric.Ellipse.prototype._render = function (ctx) {
    const w = this.rx * 2;
    const h = this.ry * 2;
    const key = `${w}x${h}:${this.fill}:${this.stroke}:${this.strokeWidth}:${this.__roughSeed}`;
    const d = drawableFor(this, key, () =>
      gen.ellipse(0, 0, w, h, optsFor(this)),
    );
    drawRough(ctx, this, d);
  };

  fabric.Polygon.prototype._render = function (ctx) {
    const pts = this.points.map((p) => [
      p.x - this.pathOffset.x,
      p.y - this.pathOffset.y,
    ]);
    const key = `${JSON.stringify(pts)}:${this.fill}:${this.stroke}:${this.strokeWidth}:${this.__roughSeed}`;
    const d = drawableFor(this, key, () => gen.polygon(pts, optsFor(this)));
    drawRough(ctx, this, d);
  };

  fabric.Line.prototype._render = function (ctx) {
    const p = this.calcLinePoints();
    const key = `${p.x1},${p.y1},${p.x2},${p.y2}:${this.stroke}:${this.strokeWidth}:${this.__roughSeed}`;
    const d = drawableFor(this, key, () =>
      gen.line(p.x1, p.y1, p.x2, p.y2, optsFor(this)),
    );
    drawRough(ctx, this, d);
  };
};
