import { Rectangle } from "./menus/rectangle";
import { Circle } from "./menus/circle";
import { Font } from "./menus/font";

const toolFactory = {
    rectangle: new Rectangle(),
    circle: new Circle(),
    font: new Font()
};

const create = (tool, canvas, event) => {
    toolFactory[tool].create(canvas, event);
}

const draw = (tool, canvas, event) => {
    toolFactory[tool].draw(canvas, event);
}


export { draw, create };