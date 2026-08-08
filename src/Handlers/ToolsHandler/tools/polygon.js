import { fabric } from "fabric";
import { Tool } from "../toolGeneric";
import { resolveToolStyle } from "../toolStyle";

const SIDES = 6;
// Size used when the tool is clicked without dragging (like the other shapes
// that drop a default shape on a plain click).
const DEFAULT_RADIUS = 40;

// Vertices of a regular polygon centred on (0, 0) with the given radius.
// Points are relative to the object's centre; position comes from left/top.
// Starts at the top so the shape reads upright as it is drawn.
const polygonPoints = (radius) => {
  const points = [];
  for (let i = 0; i < SIDES; i++) {
    const angle = (Math.PI * 2 * i) / SIDES - Math.PI / 2;
    points.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }
  return points;
};

export class Polygon extends Tool {
  constructor() {
    super();
    this.origX = null;
    this.origY = null;
    this.pointer = null;
    this.polygon = null;
  }

  // Resize the polygon to the given radius, keeping its centre at the click
  // point. _setPositionDimensions() recomputes width/height but resets
  // left/top, so the centre is restored afterwards.
  applyRadius(radius) {
    this.polygon.set({ points: polygonPoints(radius) });
    this.polygon._setPositionDimensions({});
    this.polygon.set({ left: this.origX, top: this.origY });
    this.polygon.setCoords();
  }

  create(canvas, event) {
    this.pointer = canvas.getPointer(event.e);
    // The click point becomes the centre; the shape grows outward from it.
    this.origX = this.pointer.x;
    this.origY = this.pointer.y;
    this.polygon = new fabric.Polygon(polygonPoints(1), {
      left: this.origX,
      top: this.origY,
      originX: "center",
      originY: "center",
      ...resolveToolStyle(canvas),
      objectCaching: false, // recompute the bounding box as it is dragged
      selectable: true,
    });
    canvas.add(this.polygon);
  }

  draw(canvas, event) {
    if (!this.polygon) {
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
    if (!this.polygon) {
      return;
    }
    // A plain click (no real drag) leaves a near-zero shape — give it a
    // sensible default size instead of dropping it, so click-to-create works
    // as well as drag-to-size.
    if (this.polygon.width < 5 || this.polygon.height < 5) {
      this.applyRadius(DEFAULT_RADIUS);
    }
    this.polygon.setCoords();
  }
}
