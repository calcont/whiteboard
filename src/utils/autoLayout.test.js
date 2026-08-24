import { layoutGraph } from "./autoLayout";

const node = (id, cx, cy) => ({ id, w: 100, h: 60, cx, cy });

describe("layoutGraph", () => {
  test("returns null when there's nothing to lay out", () => {
    expect(layoutGraph([], [])).toBeNull();
    expect(layoutGraph([node("a", 0, 0)], [])).toBeNull(); // single node
    expect(layoutGraph([node("a", 0, 0), node("b", 0, 0)], [])).toBeNull(); // no edges
  });

  test("lays a chain A->B->C into descending ranks (top-to-bottom)", () => {
    const nodes = [node("a", 0, 0), node("b", 0, 0), node("c", 0, 0)];
    const edges = [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ];
    const pos = layoutGraph(nodes, edges);
    expect(pos).not.toBeNull();
    const a = pos.get("a");
    const b = pos.get("b");
    const c = pos.get("c");
    // each rank is strictly below the previous
    expect(b.cy).toBeGreaterThan(a.cy);
    expect(c.cy).toBeGreaterThan(b.cy);
  });

  test("keeps the layout centred on the diagram's current centroid", () => {
    const nodes = [node("a", 500, 300), node("b", 520, 320)];
    const edges = [{ from: "a", to: "b" }];
    const pos = layoutGraph(nodes, edges);
    const cx = (pos.get("a").cx + pos.get("b").cx) / 2;
    const cy = (pos.get("a").cy + pos.get("b").cy) / 2;
    // new centroid ≈ old centroid (510, 310), within rounding
    expect(Math.round(cx)).toBe(510);
    expect(Math.round(cy)).toBe(310);
  });

  test("respects rankdir LR (siblings flow left-to-right)", () => {
    const nodes = [node("a", 0, 0), node("b", 0, 0)];
    const edges = [{ from: "a", to: "b" }];
    const pos = layoutGraph(nodes, edges, { rankdir: "LR" });
    expect(pos.get("b").cx).toBeGreaterThan(pos.get("a").cx);
  });
});
