import { Tool } from "../toolGeneric";

export class Eraser extends Tool {
  constructor() {
    super();
    this.target = null;
    this.opacity = 0.2;
    this.targets = [];
  }

  create(canvas, event) {
    if (event.target) {
      this.target = event.target;
      this.target.selectable = false;
      this.target.opacity = this.opacity;
      this.targets.push(this.target);
    }
  }

  draw(canvas, event) {
    if (event.target) {
      event.target.selectable = false;
      event.target.opacity = this.opacity;
      this.targets.push(event.target);
    }
  }

  done(canvas) {
    this.targets.forEach((target) => {
      canvas.remove(target);
    });
    this.targets = [];
  }
}
