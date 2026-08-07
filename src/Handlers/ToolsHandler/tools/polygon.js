import { fabric } from "fabric";
import { Tool } from "../toolGeneric";

const SIDES = 6;

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
      fill: "transparent",
      stroke: "black",
      strokeWidth: 3,
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
    this.polygon.set({ points: polygonPoints(radius) });
    // Recompute width/height/pathOffset from the new points. This resets
    // left/top, so restore the centre to the original click point afterwards.
    this.polygon._setPositionDimensions({});
    this.polygon.set({ left: this.origX, top: this.origY });
    this.polygon.setCoords();
  }

  done(canvas) {
    if (!this.polygon) {
      return;
    }
    // Drop accidental clicks that never grew into a shape.
    if (this.polygon.width < 5 || this.polygon.height < 5) {
      canvas.remove(this.polygon);
      this.polygon = null;
      return;
    }
    this.polygon.setCoords();
  }
}
