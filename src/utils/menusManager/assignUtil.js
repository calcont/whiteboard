import {Rectangle} from "./menus/rectangle";
import {Circle} from "./menus/circle";
import {Font} from "./menus/font";
import {Diamond} from "./menus/diamond";
import {Arrow} from "./menus/arrow";
import {TOOL_CONSTANTS} from "../../constants/tools";

const toolFactory = {
    [TOOL_CONSTANTS.RECTANGLE]: new Rectangle(),
    [TOOL_CONSTANTS.CIRCLE]: new Circle(),
    [TOOL_CONSTANTS.FONT]: new Font(),
    [TOOL_CONSTANTS.DIAMOND]: new Diamond(),
    [TOOL_CONSTANTS.ARROW]: new Arrow(),
};

const create = (tool, canvas, event) => {
    toolFactory[tool].create(canvas, event);
}

const draw = (tool, canvas, event) => {
    toolFactory[tool].draw(canvas, event);
}


export {draw, create};