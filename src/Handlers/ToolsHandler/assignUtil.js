import { Rectangle, Circle, Font, Diamond, Arrow, Eraser } from "./tools";
import { TOOL_CONSTANTS } from "../../constants";

const toolFactory = {
  [TOOL_CONSTANTS.RECTANGLE]: new Rectangle(),
  [TOOL_CONSTANTS.CIRCLE]: new Circle(),
  [TOOL_CONSTANTS.FONT]: new Font(),
  [TOOL_CONSTANTS.DIAMOND]: new Diamond(),
  [TOOL_CONSTANTS.ARROW]: new Arrow(),
  [TOOL_CONSTANTS.ERASER]: new Eraser(),
};

const create = (tool, canvas, event) => {
  toolFactory[tool].create(canvas, event);
};

const draw = (tool, canvas, event) => {
  toolFactory[tool].draw(canvas, event);
};

const done = (tool, canvas) => {
  toolFactory[tool].done(canvas);
};

export { draw, create, done };
