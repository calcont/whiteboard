import { fabric } from "fabric";
import { Tool } from "../toolGeneric";
import { resolveToolStyle } from "../toolStyle";

const ARROW_HEAD_PATH = "M 0 0 L 20 10 L 0 20 Z";

const angleBetween = (start, end) =>
  (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;

// Build a fresh arrow (line + fixed-size head) from start -> end with the given
// style. Exported so the resize handler can rebuild an arrow at a new size
// without scaling — and distorting — the head.
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
  const head = new fabric.Path(ARROW_HEAD_PATH, {
    stroke: "",
    strokeWidth: 0,
    fill: style.stroke,
    originX: "center",
    originY: "center",
    left: end.x,
    top: end.y,
    angle: angleBetween(start, end),
    hasControls: false,
    hasBorders: false,
    selectable: false,
  });
  return new fabric.Group([line, head], { objectCaching: false });
};

export class Arrow extends Tool {
  constructor() {
    super();
    this.origX = null;
    this.origY = null;
    this.pointer = null;
    this.line = null;
    this.arrowHead = null;
    this.style = null;
    this.deleteOffset = 10;
  }

  create(canvas, event) {
    this.pointer = canvas.getPointer(event.e);
    this.origX = this.pointer.x;
    this.origY = this.pointer.y;
    this.style = resolveToolStyle(canvas);

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
    this.arrowHead = new fabric.Path(ARROW_HEAD_PATH, {
      stroke: "",
      strokeWidth: 0,
      fill: this.style.stroke,
      originX: "center",
      originY: "center",
      top: this.origY,
      left: this.origX,
      hasControls: false,
      hasBorders: false,
      selectable: false,
    });
    canvas.add(this.line, this.arrowHead);
  }

  draw(canvas, event) {
    if (!this.line) {
      return;
    }
    this.pointer = canvas.getPointer(event.e);
    this.line.set({ x2: this.pointer.x, y2: this.pointer.y });
    this.line.setCoords();
    this.arrowHead.left = this.pointer.x;
    this.arrowHead.top = this.pointer.y;
    this.arrowHead.angle = angleBetween(
      { x: this.origX, y: this.origY },
      this.pointer,
    );
    this.arrowHead.setCoords();
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
    if (length < this.deleteOffset) {
      return;
    }
    const arrow = buildArrowGroup(
      { x: this.origX, y: this.origY },
      { x: this.pointer.x, y: this.pointer.y },
      this.style || resolveToolStyle(canvas),
    );
    arrow.setCoords();
    canvas.add(arrow);
  }
}
