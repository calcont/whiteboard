import { fabric } from "fabric";
import { Tool } from "../toolGeneric";

export class Font extends Tool {
    create(canvas, event) {
        createFont(canvas, event);
    }
    done(canvas, event) {
        // super.done(canvas, event);
    }
}

const createFont = (canvas, event) => {
    let pointer = canvas.getPointer(event.e);
    let text = new fabric.IText("", {
        left: pointer.x,
        top: pointer.y,
        fill: "black",
        fontSize: 20,
        fontFamily: "Arial",
    });
    text.on("editing:exited", () => {
        if (text.text === "") {
            canvas.remove(text);
        }
    });
    text.on("editing:entered", () => {
       canvas.selection = false;
    });
    canvas.add(text);
    text.enterEditing();
    text.selectAll();
    canvas.renderAll();
}
