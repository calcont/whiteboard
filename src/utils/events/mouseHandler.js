import { tools } from '../../constants/tools.js';

const handleMouseDown = (canvas, tool, createFunction, e) => {
    if ( tools[tool].createOnClick ) {
        createFunction(tool, canvas, e);
    }
};

const handleMouseMove = (canvas, tool, drawFunction, e) => {
    if ( tools[tool].onMove) {
        canvas.selection = false;
        drawFunction(tool, canvas, e);
    }
    canvas.renderAll();
}

const handleMouseUp = (canvas, tool, toolCallBack) => {
    sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
    if (onMoveTools.includes(tool)) {
        canvas.selection = true;
    }
    toolCallBack('cursor');
}

export { handleMouseDown, handleMouseMove, handleMouseUp }; 