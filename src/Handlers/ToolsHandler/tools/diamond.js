import { fabric } from "fabric";
import { Tool } from "../toolGeneric";

// Size used when the tool is clicked without dragging (like the other shapes
// that drop a default shape on a plain click).
const DEFAULT_RADIUS = 50;

// Diamond (rhombus) vertices relative to the centre (0, 0): top, right,
// bottom, left. Points are relative to the object's centre; position comes
// from left/top.
const diamondPoints = (radius) => [
  { x: 0, y: -radius },
  { x: radius, y: 0 },
  { x: 0, y: radius },
  { x: -radius, y: 0 },
];

export class Diamond extends Tool {
  constructor() {
    super();
    this.origX = null;
    this.origY = null;
    this.pointer = null;
    this.diamond = null;
  }

  // Resize the diamond to the given radius, keeping its centre at the click
  // point. _setPositionDimensions() recomputes width/height but resets
  // left/top, so the centre is restored afterwards.
  applyRadius(radius) {
    this.diamond.set({ points: diamondPoints(radius) });
    this.diamond._setPositionDimensions({});
    this.diamond.set({ left: this.origX, top: this.origY });
    this.diamond.setCoords();
  }

  create(canvas, event) {
    this.pointer = canvas.getPointer(event.e);
    // The click point becomes the centre; the shape grows outward from it.
    this.origX = this.pointer.x;
    this.origY = this.pointer.y;
    this.diamond = new fabric.Polygon(diamondPoints(1), {
      left: this.origX,
      top: this.origY,
      originX: "center",
      originY: "center",
      fill: "transparent",
      stroke: "black",
      strokeWidth: 3,
      objectCaching: false, // recompute the bounding box as it is dragged
      selectable: true,
    });
    canvas.add(this.diamond);
  }

  draw(canvas, event) {
    if (!this.diamond) {
      return;
    }
    this.pointer = canvas.getPointer(event.e);
    const radius = Math.max(
      Math.hypot(this.pointer.x - this.origX, this.pointer.y - this.origY),
      1,
    );
    this.applyRadius(radius);
  }

  done() {
    if (!this.diamond) {
      return;
    }
    // A plain click (no real drag) leaves a near-zero shape — give it a
    // sensible default size instead of dropping it, so click-to-create works
    // as well as drag-to-size.
    if (this.diamond.width < 5 || this.diamond.height < 5) {
      this.applyRadius(DEFAULT_RADIUS);
    }
    this.diamond.setCoords();
  }
}
