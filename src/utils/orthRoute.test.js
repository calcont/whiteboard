import { routeWithObstacles } from "./orthRoute";

// Does any segment of the route pass through the rect's interior?
const crossesRect = (route, o) => {
  for (let i = 1; i < route.length; i += 1) {
    const a = route[i - 1];
    const b = route[i];
    const x1 = Math.min(a.x, b.x);
    const x2 = Math.max(a.x, b.x);
    const y1 = Math.min(a.y, b.y);
    const y2 = Math.max(a.y, b.y);
    if (x1 < o.x2 - 1 && x2 > o.x1 + 1 && y1 < o.y2 - 1 && y2 > o.y1 + 1)
      return true;
  }
  return false;
};

const axisAligned = (r) => {
  for (let i = 1; i < r.length; i += 1)
    expect(r[i].x === r[i - 1].x || r[i].y === r[i - 1].y).toBe(true);
};

describe("routeWithObstacles", () => {
  test("returns null with no obstacles (caller falls back)", () => {
    expect(
      routeWithObstacles(
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 100, y: 0 },
        {
          x: -1,
          y: 0,
        },
        [],
      ),
    ).toBeNull();
  });

  test("routes AROUND a box sitting on the straight line, staying orthogonal", () => {
    const s = { x: 0, y: 0 };
    const e = { x: 400, y: 0 };
    const box = { left: 150, top: -60, width: 100, height: 120 }; // blocks y=0
    const r = routeWithObstacles(s, { x: 1, y: 0 }, e, { x: -1, y: 0 }, [box]);
    expect(r).not.toBeNull();
    expect(r[0]).toEqual({ x: 0, y: 0 });
    expect(r[r.length - 1]).toEqual({ x: 400, y: 0 });
    axisAligned(r);
    // the drawn path must not cut through the box
    expect(
      crossesRect(r, {
        x1: box.left,
        y1: box.top,
        x2: box.left + box.width,
        y2: box.top + box.height,
      }),
    ).toBe(false);
  });

  test("does not route through the endpoints' own shapes (no coil-back)", () => {
    // two boxes overlapping horizontally; ports face each other
    const A = { left: 0, top: 0, width: 120, height: 80 }; // s on its right edge
    const B = { left: 90, top: 0, width: 120, height: 80 }; // overlaps A in x
    const s = { x: 120, y: 40 };
    const e = { x: 90, y: 40 };
    const r = routeWithObstacles(s, { x: 1, y: 0 }, e, { x: -1, y: 0 }, [A, B]);
    if (r) {
      axisAligned(r);
      expect(crossesRect(r, { x1: 0, y1: 0, x2: 120, y2: 80 })).toBe(false);
      expect(crossesRect(r, { x1: 90, y1: 0, x2: 210, y2: 80 })).toBe(false);
    }
    // (null is acceptable here — the caller then falls back to a mid-bend)
  });
});
