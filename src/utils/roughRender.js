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

// The object's TOTAL on-screen scale (its own scale × any parent group's),
// pulled from the full transform matrix. fabric applies this scale to the ctx
// before _render runs, so a rough path traced in local space would be drawn
// scaled — thickening the stroke and blowing up the wobble. We use this to draw
// rough at the on-screen size in a scale-compensated (1:1) ctx instead, so the
// sketch keeps a constant stroke weight and wobble at any size (Excalidraw-like).
const effScale = (obj) => {
  const d = fabric.util.qrDecompose(obj.calcTransformMatrix());
  return { sx: Math.abs(d.scaleX) || 1, sy: Math.abs(d.scaleY) || 1 };
};

// SVG path for a rounded rectangle (rough's gen.path traces it) — rough has no
// native rounded-rect, so this is how sketchy corners get their radius.
const roundedRectPath = (x, y, w, h, rx, ry) => {
  const r = x + w;
  const b = y + h;
  return [
    `M${x + rx},${y}`,
    `L${r - rx},${y} Q${r},${y} ${r},${y + ry}`,
    `L${r},${b - ry} Q${r},${b} ${r - rx},${b}`,
    `L${x + rx},${b} Q${x},${b} ${x},${b - ry}`,
    `L${x},${y + ry} Q${x},${y} ${x + rx},${y}`,
    "Z",
  ].join(" ");
};

// Trace a rounded-rect path onto a ctx (for the crisp exact-geometry fill).
const traceRoundedRect = (ctx, x, y, w, h, rx, ry) => {
  const r = x + w;
  const b = y + h;
  ctx.beginPath();
  ctx.moveTo(x + rx, y);
  ctx.lineTo(r - rx, y);
  ctx.quadraticCurveTo(r, y, r, y + ry);
  ctx.lineTo(r, b - ry);
  ctx.quadraticCurveTo(r, b, r - rx, b);
  ctx.lineTo(x + rx, b);
  ctx.quadraticCurveTo(x, b, x, b - ry);
  ctx.lineTo(x, y + ry);
  ctx.quadraticCurveTo(x, y, x + rx, y);
  ctx.closePath();
};

// Rough options for the STROKE only. We intentionally do NOT let rough draw the
// fill — its solid fill is a separate wobbly polygon that doesn't line up with
// the stroke, so the fill bleeds past the border. Instead we fill the exact
// geometry crisply (fillExact) and draw the rough outline on top. Single pass
// (disableMultiStroke) so a thick or dashed border doesn't render doubled.
const optsFor = (obj) => ({
  seed: seedFor(obj),
  roughness: ROUGHNESS,
  stroke: obj.stroke || "transparent",
  strokeWidth: obj.strokeWidth || 1,
  disableMultiStroke: true,
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

// Draw a shape's rough OUTLINE at its on-screen size inside a scale-compensated
// (1:1 with screen pixels) ctx, so the stroke weight and the hand-drawn wobble
// stay constant no matter how the shape (or its parent group) is scaled. The
// caller regenerates the rough drawable at the on-screen dimensions it's handed.
// Crisp fills are drawn by the caller BEFORE this, in normal local space.
const drawRoughScreenSpace = (ctx, obj, makeAtScreenSize) => {
  const { sx, sy } = effScale(obj);
  ctx.save();
  ctx.scale(1 / sx, 1 / sy); // undo the object's scale -> 1 unit == 1 screen px
  drawRough(ctx, obj, makeAtScreenSize(sx, sy));
  ctx.restore();
};

// Global sketchy on/off. Default ON (the excalidraw look); a crisp mode serves
// clean infra/architecture diagrams. Persisted in localStorage like the theme.
const SKETCHY_KEY = "wb-sketchy";
const readSketchy = () => {
  try {
    return localStorage.getItem(SKETCHY_KEY) !== "false";
  } catch {
    return true;
  }
};
let sketchyEnabled = readSketchy();

export const isSketchyMode = () => sketchyEnabled;
export const setSketchyMode = (on) => {
  sketchyEnabled = !!on;
  try {
    localStorage.setItem(SKETCHY_KEY, String(sketchyEnabled));
  } catch {
    // ignore persistence failure
  }
};

// Install a rough _render on a shape class, keeping its crisp original as a
// fallback for when sketchy mode is off.
const installRough = (Klass, roughRender) => {
  const crisp = Klass.prototype._render;
  Klass.prototype._render = function (ctx) {
    if (!sketchyEnabled) return crisp.call(this, ctx);
    return roughRender.call(this, ctx);
  };
};

export const enableRoughRendering = () => {
  if (fabric.__roughEnabled) return;
  fabric.__roughEnabled = true;

  installRough(fabric.Rect, function (ctx) {
    const w = this.width;
    const h = this.height;
    const rx = Math.min(this.rx || 0, w / 2);
    const ry = Math.min(this.ry || 0, h / 2);
    const rounded = rx > 0.5 || ry > 0.5;
    if (hasFill(this.fill)) {
      ctx.fillStyle = this.fill;
      if (rounded) {
        traceRoundedRect(ctx, -w / 2, -h / 2, w, h, rx, ry);
        ctx.fill();
      } else {
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
    }
    drawRoughScreenSpace(ctx, this, (sx, sy) => {
      const W = w * sx;
      const H = h * sy;
      const RX = rx * sx;
      const RY = ry * sy;
      const key = `${Math.round(W)}x${Math.round(H)}:r${Math.round(RX)}x${Math.round(RY)}:${this.stroke}:${this.strokeWidth}:${this.strokeDashArray}:${this.__roughSeed}`;
      return drawableFor(this, key, () =>
        rounded
          ? gen.path(
              roundedRectPath(-W / 2, -H / 2, W, H, RX, RY),
              optsFor(this),
            )
          : gen.rectangle(-W / 2, -H / 2, W, H, optsFor(this)),
      );
    });
  });

  installRough(fabric.Ellipse, function (ctx) {
    if (hasFill(this.fill)) {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.rx, this.ry, 0, 0, 2 * Math.PI);
      ctx.fillStyle = this.fill;
      ctx.fill();
    }
    drawRoughScreenSpace(ctx, this, (sx, sy) => {
      const W = this.rx * 2 * sx;
      const H = this.ry * 2 * sy;
      const key = `${Math.round(W)}x${Math.round(H)}:${this.stroke}:${this.strokeWidth}:${this.strokeDashArray}:${this.__roughSeed}`;
      return drawableFor(this, key, () =>
        gen.ellipse(0, 0, W, H, optsFor(this)),
      );
    });
  });

  installRough(fabric.Polygon, function (ctx) {
    const pts = this.points.map((p) => [
      p.x - this.pathOffset.x,
      p.y - this.pathOffset.y,
    ]);
    if (hasFill(this.fill)) {
      ctx.beginPath();
      pts.forEach((p, i) =>
        i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]),
      );
      ctx.closePath();
      ctx.fillStyle = this.fill;
      ctx.fill();
    }
    drawRoughScreenSpace(ctx, this, (sx, sy) => {
      const scaled = pts.map(([x, y]) => [x * sx, y * sy]);
      const key = `${JSON.stringify(scaled.map(([x, y]) => [Math.round(x), Math.round(y)]))}:${this.stroke}:${this.strokeWidth}:${this.strokeDashArray}:${this.__roughSeed}`;
      return drawableFor(this, key, () => gen.polygon(scaled, optsFor(this)));
    });
  });

  installRough(fabric.Line, function (ctx) {
    const p = this.calcLinePoints();
    drawRoughScreenSpace(ctx, this, (sx, sy) => {
      const x1 = p.x1 * sx;
      const y1 = p.y1 * sy;
      const x2 = p.x2 * sx;
      const y2 = p.y2 * sy;
      const key = `${Math.round(x1)},${Math.round(y1)},${Math.round(x2)},${Math.round(y2)}:${this.stroke}:${this.strokeWidth}:${this.strokeDashArray}:${this.__roughSeed}`;
      return drawableFor(this, key, () =>
        gen.line(x1, y1, x2, y2, optsFor(this)),
      );
    });
  });
};
