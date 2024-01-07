import {TOOL_CONSTANTS, TOOL_FUNCTIONS} from '../../constants/';

const handleMouseDown = (canvas, tool, createFunction, e) => {
    if (TOOL_FUNCTIONS[tool].createOnClick) {
        canvas.discardActiveObject();
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

const handleMouseUp = (canvas, tool, doneFunction, toolCallBack, lockStatus) => {
    // sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
    if (TOOL_FUNCTIONS[tool].createOnClick) {
        doneFunction(tool, canvas);
        canvas.selection = true;
        const currentDrawnObject = canvas.item(canvas.getObjects().length - 1);
        if (currentDrawnObject) {
            if (!lockStatus) {
                canvas.setActiveObject(currentDrawnObject);
                toolCallBack(TOOL_CONSTANTS.CURSOR);
            } else {
                currentDrawnObject.set({selectable: false});
            }
        }
        canvas.renderAll();
    }
}

export {handleMouseDown, handleMouseMove, handleMouseUp};