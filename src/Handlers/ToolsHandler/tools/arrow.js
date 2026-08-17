import { fabric } from "fabric";
import { Tool } from "../toolGeneric";
import { resolveToolStyle } from "../toolStyle";
import { attachEndpointControls } from "../../../utils/arrowEndpoints";
import { bindArrowOnDraw } from "../../../utils/binding";

const ARROW_HEAD_PATH = "M 0 0 L 20 10 L 0 20 Z";

const angleBetween = (start, end) =>
  (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;

// A fixed-size arrowhead (filled triangle) centred at `at`, pointing along
// `angle`. Kept a plain child so the head config can be derived from the number
// of path children (1 = single, 2 = double) — no custom props to persist.
const makeHead = (at, angle, color) =>
  new fabric.Path(ARROW_HEAD_PATH, {
    stroke: "",
    strokeWidth: 0,
    fill: color,
    originX: "center",
    originY: "center",
    left: at.x,
    top: at.y,
    angle,
    hasControls: false,
    hasBorders: false,
    selectable: false,
  });

// Build a fresh arrow (line + fixed-size head(s)) from start -> end with the
// given style. style.heads: "end" (default, single head at end) or "both"
// (a second head at start). Exported so the resize handler and the properties
// panel can rebuild an arrow without scaling — and distorting — the head(s).
export const buildArrowGroup = (start, end, style) => {
  const line = new fabric.Line([start.x, start.y, end.x, end.y], {
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    strokeDashArray: style.strokeDashArray || null,
    strokeUniform: true,
    originX: "center",
    originY: "center",
    hasControls: false,
    hasBorders: false,
    selectable: false,
  });
  const children = [
    line,
    makeHead(end, angleBetween(start, end), style.stroke),
  ];
  if (style.heads === "both") {
    children.push(makeHead(start, angleBetween(end, start), style.stroke));
  }
  // Optional centred text label, anchored to the line's midpoint. Carried
  // through rebuilds (resize) so a labelled arrow keeps its label; a non-
  // interactive child like the head(s), so the arrow group stays the unit.
  if (style.label && style.label.text) {
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    // Only set provided text props — passing an undefined fontFamily makes
    // fabric's font-cache crash on .toLowerCase(); omitting it keeps fabric's
    // own default instead.
    const labelOpts = {
      left: mid.x,
      top: mid.y,
      originX: "center",
      originY: "center",
      textAlign: "center",
      hasControls: false,
      hasBorders: false,
      selectable: false,
    };
    if (style.label.fontFamily) labelOpts.fontFamily = style.label.fontFamily;
    if (style.label.fontSize) labelOpts.fontSize = style.label.fontSize;
    if (style.label.fill) labelOpts.fill = style.label.fill;
    // Background masks the line behind the label so it isn't struck through.
    if (style.label.backgroundColor)
      labelOpts.backgroundColor = style.label.backgroundColor;
    // IText (not Textbox): the label auto-sizes to its content on the line
    // instead of wrapping inside a fixed narrow box.
    children.push(new fabric.IText(style.label.text, labelOpts));
  }
  const group = new fabric.Group(children, {
    objectCaching: false,
    // Select an arrow by its actual line/head pixels, not its (large) bounding
    // box — so two overlapping arrows can each be picked by clicking the one you
    // mean instead of always grabbing the top box. Per-object, so filled/
    // transparent shapes keep convenient click-anywhere bbox selection.
    perPixelTargetFind: true,
  });
  // Excalidraw-style editing: drag either endpoint to re-aim/extend the arrow,
  // instead of scaling a bounding box. Replaces the default controls with two
  // endpoint handles (tail + tip).
  attachEndpointControls(group);
  return group;
};

export class Arrow extends Tool {
  constructor() {
    super();
    this.origX = null;
    this.origY = null;
    this.pointer = null;
    this.line = null;
    this.arrowHead = null;
    this.arrowHeadStart = null;
    this.style = null;
    this.heads = "end";
    this.deleteOffset = 10;
  }

  create(canvas, event) {
    this.pointer = canvas.getPointer(event.e);
    this.origX = this.pointer.x;
    this.origY = this.pointer.y;
    this.style = resolveToolStyle(canvas);
    this.heads = canvas.currentArrowHeads === "both" ? "both" : "end";

    // Live preview: a plain line + head that follow the cursor; on mouse-up
    // they're replaced by a proper arrow group (buildArrowGroup).
    this.line = new fabric.Line(
      [this.origX, this.origY, this.origX, this.origY],
      {
        stroke: this.style.stroke,
        strokeWidth: this.style.strokeWidth,
        strokeDashArray: this.style.strokeDashArray,
        originX: "center",
        originY: "center",
        hasControls: false,
        hasBorders: false,
        selectable: false,
      },
    );
    this.arrowHead = makeHead(
      { x: this.origX, y: this.origY },
      0,
      this.style.stroke,
    );
    canvas.add(this.line, this.arrowHead);
    // Preview the second head too when drawing a double-headed arrow.
    if (this.heads === "both") {
      this.arrowHeadStart = makeHead(
        { x: this.origX, y: this.origY },
        0,
        this.style.stroke,
      );
      canvas.add(this.arrowHeadStart);
    }
  }

  draw(canvas, event) {
    if (!this.line) {
      return;
    }
    this.pointer = canvas.getPointer(event.e);
    const origin = { x: this.origX, y: this.origY };
    this.line.set({ x2: this.pointer.x, y2: this.pointer.y });
    this.line.setCoords();
    this.arrowHead.left = this.pointer.x;
    this.arrowHead.top = this.pointer.y;
    this.arrowHead.angle = angleBetween(origin, this.pointer);
    this.arrowHead.setCoords();
    if (this.arrowHeadStart) {
      this.arrowHeadStart.angle = angleBetween(this.pointer, origin);
      this.arrowHeadStart.setCoords();
    }
  }

  done(canvas) {
    // Use the arrow's actual length, not just its horizontal extent — a
    // vertical/steep arrow has a small x-delta and was being discarded as if
    // it were a stray click, so it never appeared.
    const length = Math.hypot(
      this.pointer.x - this.origX,
      this.pointer.y - this.origY,
    );
    canvas.remove(this.line, this.arrowHead);
    if (this.arrowHeadStart) canvas.remove(this.arrowHeadStart);
    if (length < this.deleteOffset) {
      return;
    }
    const arrow = buildArrowGroup(
      { x: this.origX, y: this.origY },
      { x: this.pointer.x, y: this.pointer.y },
      { ...(this.style || resolveToolStyle(canvas)), heads: this.heads },
    );
    arrow.setCoords();
    canvas.add(arrow);
    // Bind either end that was dropped on a shape, and snap it to the border so
    // the arrow stays glued when that shape later moves (eraser.io style).
    bindArrowOnDraw(
      canvas,
      arrow,
      { x: this.origX, y: this.origY },
      { x: this.pointer.x, y: this.pointer.y },
    );
  }
}
