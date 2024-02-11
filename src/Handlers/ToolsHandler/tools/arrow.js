import { fabric } from "fabric";
import { Tool } from "../toolGeneric";

export class Arrow extends Tool {
  constructor() {
    super();
    this.origX = null;
    this.origY = null;
    this.pointer = null;
    this.line = null;
    this.arrowHead = null;
    this.arrow = null;
    this.deleteOffset = 10;
  }

  create(canvas, event) {
    this.pointer = canvas.getPointer(event.e);
    this.origX = this.pointer.x;
    this.origY = this.pointer.y;
    let arrowHeadPath = "M 0 0 L 20 10 L 0 20 Z";

    this.line = new fabric.Line(
      [this.origX, this.origY, this.origX, this.origY],
      {
        stroke: "black",
        strokeWidth: 2,
        originX: "center",
        originY: "center",
        hasControls: false,
        hasBorders: false,
        selectable: false,
      },
    );

    this.arrowHead = new fabric.Path(arrowHeadPath, {
      stroke: "",
      strokeWidth: 0,
      fill: "black",
      originX: "center",
      originY: "center",
      hasControls: false,
      hasBorders: false,
      top: this.origY,
      left: this.origX,
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
    this.arrowHead.angle = this.calcArrowAngle(
      this.pointer,
      this.origX,
      this.origY,
    );
    this.arrowHead.setCoords();
  }

  done(canvas) {
    let width = Math.abs(this.pointer.x - this.origX);
    if (width < this.deleteOffset) {
      canvas.remove(this.line, this.arrowHead);
      return;
    }
    this.arrow = new fabric.Group([this.line, this.arrowHead], {
      objectCaching: false,
    });
    canvas.remove(this.line, this.arrowHead);
    this.arrow.setCoords();
    canvas.add(this.arrow);
  }

  calcArrowAngle(pointer, origX, origY) {
    return (Math.atan2(pointer.y - origY, pointer.x - origX) * 180) / Math.PI;
  }
}
