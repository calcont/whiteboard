import { fabric } from "fabric";
import {
  isLabelableShape,
  isLabeledShape,
  getLabelParts,
  finishLabelEditing,
  normalizeLabeledGroupScale,
  isArrow,
  getArrowParts,
  counterScaleArrowDecorations,
} from "./shapeLabel";
import { buildArrowGroup } from "../Handlers/ToolsHandler/tools/arrow";

const makeCanvas = () => new fabric.Canvas(document.createElement("canvas"));
const rect = (o = {}) =>
  new fabric.Rect({
    width: 160,
    height: 100,
    stroke: "#000",
    strokeWidth: 2,
    strokeUniform: true,
    ...o,
  });
const textbox = (t = "hi", o = {}) =>
  new fabric.Textbox(t, {
    width: 120,
    originX: "center",
    originY: "center",
    ...o,
  });
const labeled = () => new fabric.Group([rect(), textbox("API")]);

describe("shape kind detection", () => {
  test("basic shapes are labelable", () => {
    expect(isLabelableShape(rect())).toBe(true);
    expect(isLabelableShape(new fabric.Ellipse({ rx: 10, ry: 10 }))).toBe(true);
    expect(isLabelableShape(new fabric.Polygon([{ x: 0, y: 0 }]))).toBe(true);
  });

  test("lines and text are not labelable", () => {
    expect(isLabelableShape(new fabric.Line([0, 0, 10, 10]))).toBe(false);
    expect(isLabelableShape(textbox())).toBe(false);
    expect(isLabelableShape(null)).toBe(false);
  });

  test("a shape+text group is a labeled shape", () => {
    expect(isLabeledShape(labeled())).toBe(true);
  });

  test("an arrow (line + path) is NOT a labeled shape", () => {
    const arrow = new fabric.Group([
      new fabric.Line([0, 0, 10, 10]),
      new fabric.Path("M 0 0 L 5 5 L 0 10 z"),
    ]);
    expect(isLabeledShape(arrow)).toBe(false);
  });

  test("an icon (many paths) is NOT a labeled shape", () => {
    const icon = new fabric.Group([
      new fabric.Path("M 0 0 L 5 5 z"),
      new fabric.Path("M 1 1 L 6 6 z"),
      new fabric.Path("M 2 2 L 7 7 z"),
    ]);
    expect(isLabeledShape(icon)).toBe(false);
  });

  test("getLabelParts returns the shape and the text child", () => {
    const g = labeled();
    const { shape, text } = getLabelParts(g);
    expect(shape.type).toBe("rect");
    expect(text.type).toBe("textbox");
  });
});

describe("finishLabelEditing", () => {
  test("non-empty label groups the shape and text into one labeled group", () => {
    const c = makeCanvas();
    const shape = rect();
    const text = textbox("");
    c.add(shape);
    c.add(text);
    text.text = "Postgres";
    c.__labelPending = { shape, text, original: "" };

    finishLabelEditing(c);

    const objs = c.getObjects();
    expect(objs.length).toBe(1);
    expect(isLabeledShape(objs[0])).toBe(true);
    expect(getLabelParts(objs[0]).text.text).toBe("Postgres");
    expect(c.__labelPending).toBeNull();
  });

  test("empty label leaves the bare shape (no group)", () => {
    const c = makeCanvas();
    const shape = rect();
    const text = textbox("");
    c.add(shape);
    c.add(text);
    c.__labelPending = { shape, text, original: "" };

    finishLabelEditing(c);

    const objs = c.getObjects();
    expect(objs.length).toBe(1);
    expect(objs[0].type).toBe("rect");
  });

  test("clearing an existing label drops back to the bare shape", () => {
    const c = makeCanvas();
    const shape = rect();
    const text = textbox("Cache");
    c.add(shape);
    c.add(text);
    text.text = "";
    c.__labelPending = { shape, text, original: "Cache" };

    finishLabelEditing(c);

    expect(c.getObjects().map((o) => o.type)).toEqual(["rect"]);
  });
});

describe("normalizeLabeledGroupScale (resize keeps border width)", () => {
  test("group scale is re-baked onto children so strokeUniform holds", () => {
    const c = makeCanvas();
    const g = labeled();
    c.add(g);
    g.set({ scaleX: 1.5, scaleY: 1.5 });

    normalizeLabeledGroupScale(c, g);

    const out = c.getObjects()[0];
    const rc = out.getObjects().find((o) => o.type === "rect");
    expect(Math.round(out.scaleX * 100) / 100).toBe(1);
    expect(Math.round(rc.scaleX * 100) / 100).toBe(1.5);
    // border renders at strokeWidth because strokeUniform cancels the child scale
    expect(rc.strokeWidth).toBe(2);
  });

  test("an un-scaled group is left untouched", () => {
    const c = makeCanvas();
    const g = labeled();
    c.add(g);
    expect(normalizeLabeledGroupScale(c, g)).toBe(false);
  });

  test("non-labeled targets are ignored", () => {
    const c = makeCanvas();
    const r = rect();
    c.add(r);
    expect(normalizeLabeledGroupScale(c, r)).toBe(false);
  });
});

describe("arrow detection (isArrow)", () => {
  const arrow = (style = {}) =>
    buildArrowGroup(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { stroke: "#000", strokeWidth: 2, ...style },
    );

  test("a single-headed arrow is an arrow", () => {
    expect(isArrow(arrow())).toBe(true);
  });

  test("a double-headed arrow is an arrow", () => {
    expect(isArrow(arrow({ heads: "both" }))).toBe(true);
  });

  test("an arrow with a label is STILL an arrow", () => {
    const a = arrow({ label: { text: "edge", fontSize: 16, fill: "#000" } });
    expect(isArrow(a)).toBe(true);
    expect(getArrowParts(a).text.text).toBe("edge");
  });

  test("a labeled shape (rect + text) is NOT an arrow", () => {
    const g = new fabric.Group([
      rect(),
      new fabric.Textbox("x", { width: 40 }),
    ]);
    expect(isArrow(g)).toBe(false);
  });

  test("buildArrowGroup without a label has no text child", () => {
    expect(getArrowParts(arrow()).text).toBeNull();
  });
});

describe("arrow label editing (finishLabelEditing, kind=arrow)", () => {
  const plainArrow = () =>
    buildArrowGroup(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { stroke: "#000", strokeWidth: 2 },
    );

  test("a non-empty label is folded into the arrow group", () => {
    const c = makeCanvas();
    const a = plainArrow();
    c.add(a);
    const text = new fabric.Textbox("hop", {
      left: 50,
      top: 0,
      originX: "center",
      originY: "center",
    });
    c.add(text);
    c.__labelPending = { kind: "arrow", arrow: a, text, original: "" };

    finishLabelEditing(c);

    expect(isArrow(a)).toBe(true); // still an arrow
    expect(getArrowParts(a).text.text).toBe("hop"); // now carries the label
    expect(c.getObjects()).toContain(a);
    expect(c.getObjects()).not.toContain(text); // folded in, not top-level
  });

  test("an empty label leaves the arrow with no text child", () => {
    const c = makeCanvas();
    const a = plainArrow();
    c.add(a);
    const text = new fabric.Textbox("", {
      left: 50,
      top: 0,
      originX: "center",
      originY: "center",
    });
    c.add(text);
    c.__labelPending = { kind: "arrow", arrow: a, text, original: "" };

    finishLabelEditing(c);

    expect(getArrowParts(a).text).toBeNull();
    expect(c.getObjects()).not.toContain(text);
  });
});

describe("counterScaleArrowDecorations (live resize keeps decorations fixed)", () => {
  test("head + label stay constant size while the line stretches", () => {
    const a = buildArrowGroup(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      {
        stroke: "#000",
        strokeWidth: 2,
        heads: "both",
        label: { text: "x", fontSize: 16 },
      },
    );
    a.scaleX = 2;
    a.scaleY = 2;
    counterScaleArrowDecorations(a);
    a.getObjects().forEach((o) => {
      if (o.type === "line") {
        expect(o.scaleX).toBe(1); // line scales with the group (arrow length)
      } else {
        // head(s) + text counter-scaled to 1/groupScale -> constant rendered size
        expect(o.scaleX).toBe(0.5);
        expect(o.scaleY).toBe(0.5);
      }
    });
  });

  test("ignores non-arrows", () => {
    expect(() =>
      counterScaleArrowDecorations(new fabric.Rect({})),
    ).not.toThrow();
  });
});
