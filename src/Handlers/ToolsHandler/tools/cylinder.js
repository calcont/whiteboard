import { fabric } from "fabric";
import { Tool } from "../toolGeneric";
import { resolveToolStyle } from "../toolStyle";

// Default size for a plain click (no drag), like the other shapes.
const DEFAULT_W = 80;
const DEFAULT_H = 100;

// SVG path for a database cylinder in a w x h box (top-left origin). The cap
// ellipse stays a shallow lid across aspect ratios. `body` is the closed
// silhouette (back top rim -> right -> bottom front curve); `lid` is the front
// rim arc, stroked on top so the lid reads.
const cylinderPath = (w, h) => {
  const rx = w / 2;
  const ry = Math.max(1, Math.min(h * 0.16, w * 0.35, h / 2 - 0.5));
  const top = ry;
  const bottom = h - ry;
  const body = `M 0 ${top} A ${rx} ${ry} 0 0 1 ${w} ${top} L ${w} ${bottom} A ${rx} ${ry} 0 0 0 0 ${bottom} Z`;
  const lid = `M 0 ${top} A ${rx} ${ry} 0 0 0 ${w} ${top}`;
  return `${body} ${lid}`;
};

export class Cylinder extends Tool {
  constructor() {
    super();
    this.origX = null;
    this.origY = null;
    this.pointer = null;
    this.cylinder = null;
  }

  // Rewrite the path for the given box and pin its top-left, so the shape grows
  // from the drag start (like the rectangle) without accumulating scale. The
  // rim arcs bulge to exactly the box edges, but fabric's arc bbox misses the
  // bottom bulge — set width/height/pathOffset to the true box so selection and
  // binding match what's drawn.
  applyBox(left, top, width, height) {
    this.cylinder._setPath(fabric.util.parsePath(cylinderPath(width, height)));
    this.cylinder.set({
      width,
      height,
      pathOffset: { x: width / 2, y: height / 2 },
      left,
      top,
    });
    this.cylinder.setCoords();
  }

  create(canvas, event) {
    this.pointer = canvas.getPointer(event.e);
    this.origX = this.pointer.x;
    this.origY = this.pointer.y;
    this.cylinder = new fabric.Path(cylinderPath(1, 1), {
      left: this.origX,
      top: this.origY,
      originX: "left",
      originY: "top",
      ...resolveToolStyle(canvas),
      objectCaching: false, // recompute the bounding box as it is dragged
      selectable: true,
    });
    canvas.add(this.cylinder);
  }

  draw(canvas, event) {
    if (!this.cylinder) {
      return;
    }
    this.pointer = canvas.getPointer(event.e);
    // min() (not abs) so dragging up/left works in negative scene coords too.
    const left = Math.min(this.origX, this.pointer.x);
    const top = Math.min(this.origY, this.pointer.y);
    const width = Math.max(Math.abs(this.origX - this.pointer.x), 1);
    const height = Math.max(Math.abs(this.origY - this.pointer.y), 1);
    this.applyBox(left, top, width, height);
  }

  done() {
    if (!this.cylinder) {
      return;
    }
    // A plain click leaves a near-zero shape — drop a default-sized one instead.
    if (this.cylinder.width < 5 || this.cylinder.height < 5) {
      this.applyBox(this.origX, this.origY, DEFAULT_W, DEFAULT_H);
    }
    this.cylinder.setCoords();
  }
}
