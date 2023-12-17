import {TOOL_FUNCTIONS} from '../../constants/tools.js';

const handleMouseDown = (canvas, tool, createFunction, e) => {
    if (TOOL_FUNCTIONS[tool].createOnClick) {
        createFunction(tool, canvas, e);
    }
};

const handleMouseMove = (canvas, tool, drawFunction, e) => {
    if (TOOL_FUNCTIONS[tool].onMove) {
        canvas.selection = false;
        drawFunction(tool, canvas, e);
    }
    canvas.renderAll();
}

const handleMouseUp = (canvas, tool, done, toolCallBack) => {
    // sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
    if (TOOL_FUNCTIONS[tool].createOnClick) {
        done(tool, canvas);
        const currentObject = canvas.item(canvas.getObjects().length - 1);
        if (!currentObject?.height < 5 || !currentObject?.points) {
            canvas.setActiveObject(currentObject);
            canvas.selection = true;
            toolCallBack('cursor');
        } else {
            canvas.remove(currentObject);
        }
        canvas.renderAll();
    }
}

export {handleMouseDown, handleMouseMove, handleMouseUp};