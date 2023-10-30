const handleMouseDown = (canvas, tool, onMoveTools, createFunction, e) => {
    if (onMoveTools.includes(tool)) {
        createFunction(tool, canvas, e);
    } else {
        createFunction(tool, canvas, e);
    }
};

const handleMouseMove = (canvas, tool, onMoveTools, drawFunction, e) => {
    if (onMoveTools.includes(tool)) {
        canvas.selection = false;
        drawFunction(tool, canvas, e);
    }
    canvas.renderAll();
}

const handleMouseUp = (canvas, tool, onMoveTools, toolCallBack) => {
    sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
    if (onMoveTools.includes(tool)) {
        canvas.selection = true;
    }
    toolCallBack('cursor');
}

export { handleMouseDown, handleMouseMove, handleMouseUp }; 