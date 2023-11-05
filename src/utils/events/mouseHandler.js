import { tools } from '../../constants/tools.js';

const handleMouseDown = (canvas, tool, createFunction, e) => {
    if (tools[tool].createOnClick) {
        createFunction(tool, canvas, e);
    }
};

const handleMouseMove = (canvas, tool, drawFunction, e) => {
    if (tools[tool].onMove) {
        canvas.selection = false;
        drawFunction(tool, canvas, e);
    }
    canvas.renderAll();
}

const handleMouseUp = (canvas, tool, toolCallBack) => {
    sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
    if (tools[tool].createOnClick) {
        canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
        canvas.selection = true;
        canvas.renderAll();
    }
    toolCallBack('cursor');
}

export { handleMouseDown, handleMouseMove, handleMouseUp }; 