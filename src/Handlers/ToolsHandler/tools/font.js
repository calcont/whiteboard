import { fabric } from "fabric";
import { Tool } from "../toolGeneric";
import { resolveToolStyle } from "../toolStyle";

export class Font extends Tool {
  create(canvas, event) {
    createFont(canvas, event);
  }
}

const createFont = (canvas, event) => {
  let pointer = canvas.getPointer(event.e);
  // Text colour follows the chosen stroke colour (fabric text colour is fill).
  let text = new fabric.IText("", {
    left: pointer.x,
    top: pointer.y,
    fill: resolveToolStyle(canvas).stroke,
    fontSize: 20,
    fontFamily: "Arial",
  });
  canvas.add(text);
  text.enterEditing();
  text.selectAll();
  canvas.renderAll();
};
