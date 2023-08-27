import { fabric } from "fabric";

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

export { createFont };