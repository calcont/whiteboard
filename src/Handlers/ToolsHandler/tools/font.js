import { fabric } from "fabric";
import { Tool } from "../toolGeneric";
import { resolveTextStyle } from "../toolStyle";

export class Font extends Tool {
  create(canvas, event) {
    createFont(canvas, event);
  }
}

const createFont = (canvas, event) => {
  let pointer = canvas.getPointer(event.e);
  // Colour, family and size come from the current text style (colour is the
  // chosen stroke swatch, since fabric text colour is fill).
  let text = new fabric.IText("", {
    left: pointer.x,
    top: pointer.y,
    ...resolveTextStyle(canvas),
  });
  canvas.add(text);
  text.enterEditing();
  text.selectAll();
  canvas.renderAll();
};
