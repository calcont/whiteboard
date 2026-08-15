import { fabric } from "fabric";
import {
  isLabelableShape,
  isLabeledShape,
  getLabelParts,
  finishLabelEditing,
  normalizeLabeledGroupScale,
} from "./shapeLabel";

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
