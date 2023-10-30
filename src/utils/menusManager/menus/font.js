import { fabric } from "fabric";
import { Tool } from "../toolGeneric";

export class Font extends Tool {
    create(canvas, event) {
        createFont(canvas, event);
    }
}

const createFont = (canvas, event) => {
    let pointer = canvas.getPointer(event.e);
    let text = new fabric.IText("Enter Text", {
        left: pointer.x,
        top: pointer.y,
        fill: "black",
        fontSize: 30,
        fontFamily: "Arial",
    });
    canvas.add(text);
    text.enterEditing();
    text.selectAll();
    canvas.renderAll();
}
