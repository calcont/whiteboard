import { createRectangle, drawRectangle, createCircle, drawCircle, createFont } from "."

const create = (tool, canvas, event) => {
    if (tool === "rectangle") {
        createRectangle(canvas, event);
    }
    else if (tool === "circle") {
        createCircle(canvas, event);
    }
    else if (tool === "font") {
        createFont(canvas, event);
    }
}

const draw = (tool, canvas, event) => {
    if (tool === "rectangle") {
        drawRectangle(canvas, event)
    }
    else if (tool === "circle") {
        drawCircle(canvas, event);
    }
}


export { draw, create };