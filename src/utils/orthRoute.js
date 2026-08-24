// Obstacle-aware orthogonal router (eraser.io/Excalidraw-style elbow paths).
//
// Given two PORTS — a point plus the axis direction the path must leave it by
// (the outward normal of the shape edge it's bound to) — and a set of obstacle
// rectangles (scene bounding boxes of shapes to avoid, INCLUDING the two shapes
// the arrow connects), it finds a right-angled path from `s` to `e` that:
//   - leaves `s` / enters `e` perpendicular to their edges (via short stubs),
//   - never crosses a shape's interior (so it can't cut through a box or coil
//     back inside its own endpoints), and
//   - is as short as possible, with a penalty per 90° turn.
//
// It's a grid + A*: candidate grid lines run through the ports/stubs and each
// (margin-expanded) obstacle edge; nodes are the intersections; a node connects
// to an axis-neighbour when the segment between them is clear. Returns the point
// array, or null when the grid can't connect the ports (caller falls back).

export const OBSTACLE_MARGIN = 16; // keep the path this far off the shapes
export const STUB = 22; // perpendicular exit length (> margin, so stubs clear)
const BEND_COST = 60; // extra cost per 90° turn (prefer straighter paths)

const uniqSorted = (arr) => {
  const out = [];
  arr
    .slice()
    .sort((a, b) => a - b)
    .forEach((v) => {
      if (!out.length || Math.abs(out[out.length - 1] - v) > 0.5) out.push(v);
    });
  return out;
};

const nearestIndex = (sorted, v) => {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < sorted.length; i += 1) {
    const d = Math.abs(sorted[i] - v);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
};

// A horizontal/vertical segment is blocked if it passes through any obstacle's
// interior (touching an expanded edge is allowed — that's how the path hugs it).
const segBlocked = (ax, ay, bx, by, obs) => {
  const x1 = Math.min(ax, bx);
  const x2 = Math.max(ax, bx);
  const y1 = Math.min(ay, by);
  const y2 = Math.max(ay, by);
  const eps = 0.5;
  return obs.some(
    (o) =>
      x1 < o.x2 - eps && x2 > o.x1 + eps && y1 < o.y2 - eps && y2 > o.y1 + eps,
  );
};

const cleanColinear = (pts) => {
  const dedup = [];
  pts.forEach((p) => {
    const last = dedup[dedup.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.5 && Math.abs(last.y - p.y) < 0.5)
      return;
    dedup.push({ x: p.x, y: p.y });
  });
  if (dedup.length <= 2) return dedup;
  const out = [dedup[0]];
  for (let i = 1; i < dedup.length - 1; i += 1) {
    const a = dedup[i - 1];
    const b = dedup[i];
    const c = dedup[i + 1];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) < 1e-6) continue;
    out.push(b);
  }
  out.push(dedup[dedup.length - 1]);
  return out;
};

export const routeWithObstacles = (s, ds, e, de, obstacles) => {
  if (!obstacles || !obstacles.length) return null;
  const stubS = { x: s.x + ds.x * STUB, y: s.y + ds.y * STUB };
  const stubE = { x: e.x + de.x * STUB, y: e.y + de.y * STUB };
  const obs = obstacles.map((o) => ({
    x1: o.left - OBSTACLE_MARGIN,
    y1: o.top - OBSTACLE_MARGIN,
    x2: o.left + o.width + OBSTACLE_MARGIN,
    y2: o.top + o.height + OBSTACLE_MARGIN,
  }));

  // Candidate grid lines: through the ports/stubs and each obstacle's expanded
  // edges, plus a frame so the path can route all the way around.
  const pad = OBSTACLE_MARGIN + STUB;
  const allX = [stubS.x, stubE.x, s.x, e.x];
  const allY = [stubS.y, stubE.y, s.y, e.y];
  obs.forEach((o) => {
    allX.push(o.x1, o.x2);
    allY.push(o.y1, o.y2);
  });
  const xs = uniqSorted([
    ...allX,
    Math.min(...allX) - pad,
    Math.max(...allX) + pad,
  ]);
  const ys = uniqSorted([
    ...allY,
    Math.min(...allY) - pad,
    Math.max(...allY) + pad,
  ]);

  const si = nearestIndex(xs, stubS.x);
  const sj = nearestIndex(ys, stubS.y);
  const ei = nearestIndex(xs, stubE.x);
  const ej = nearestIndex(ys, stubE.y);
  const key = (i, j) => i * ys.length + j;

  const startK = key(si, sj);
  const goalK = key(ei, ej);
  const gScore = new Map([[startK, 0]]);
  const cameFrom = new Map();
  const cameDir = new Map();
  const heur = (i, j) => Math.abs(xs[i] - xs[ei]) + Math.abs(ys[j] - ys[ej]);
  const open = [{ k: startK, i: si, j: sj, f: heur(si, sj) }];

  let reached = false;
  while (open.length) {
    let bi = 0;
    for (let n = 1; n < open.length; n += 1) if (open[n].f < open[bi].f) bi = n;
    const cur = open.splice(bi, 1)[0];
    if (cur.k === goalK) {
      reached = true;
      break;
    }
    if (cur.f - heur(cur.i, cur.j) > (gScore.get(cur.k) ?? Infinity)) continue;
    const { i, j } = cur;
    const dirIn = cameDir.get(cur.k);
    [
      [i + 1, j, 1, 0],
      [i - 1, j, -1, 0],
      [i, j + 1, 0, 1],
      [i, j - 1, 0, -1],
    ].forEach(([ni, nj, dx, dy]) => {
      if (ni < 0 || nj < 0 || ni >= xs.length || nj >= ys.length) return;
      if (segBlocked(xs[i], ys[j], xs[ni], ys[nj], obs)) return;
      const step = Math.abs(xs[ni] - xs[i]) + Math.abs(ys[nj] - ys[j]);
      const turn = dirIn && (dirIn.x !== dx || dirIn.y !== dy) ? BEND_COST : 0;
      const nk = key(ni, nj);
      const tentative = gScore.get(cur.k) + step + turn;
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, tentative);
        cameFrom.set(nk, cur.k);
        cameDir.set(nk, { x: dx, y: dy });
        open.push({ k: nk, i: ni, j: nj, f: tentative + heur(ni, nj) });
      }
    });
  }

  if (!reached) return null;

  const path = [];
  let k = goalK;
  while (k !== undefined) {
    const i = Math.floor(k / ys.length);
    const j = k % ys.length;
    path.push({ x: xs[i], y: ys[j] });
    k = cameFrom.get(k);
  }
  path.reverse();
  // [s, stubS(=path[0]), ...grid path..., stubE(=path[last]), e] — all orthogonal.
  return cleanColinear([s, ...path, e]);
};
