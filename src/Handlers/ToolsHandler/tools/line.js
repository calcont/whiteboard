import { fabric } from "fabric";
import { Tool } from "../toolGeneric";

export class Line extends Tool {
  constructor() {
    super();
    this.origX = null;
    this.origY = null;
    this.pointer = null;
    this.line = null;
  }

  create(canvas, event) {
    this.pointer = canvas.getPointer(event.e);
    this.origX = this.pointer.x;
    this.origY = this.pointer.y;

    this.line = new fabric.Line(
      [this.origX, this.origY, this.origX, this.origY],
      {
        left: this.origX,
        top: this.origY,
        stroke: "black",
        strokeWidth: 3,
        selectable: true,
      },
    );

    canvas.add(this.line);
  }

  draw(canvas, event) {
    if (!this.line) {
      return;
    }
    this.pointer = canvas.getPointer(event.e);
    this.line.set({ x2: this.pointer.x, y2: this.pointer.y });
    this.line.setCoords();
  }

  done(canvas) {
    if (this.line.width < 5 && this.line.height < 5) {
      canvas.remove(this.line);
    }
  }
}
