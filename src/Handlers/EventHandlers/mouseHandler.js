import {TOOL_CONSTANTS, TOOL_FUNCTIONS} from '../../constants';
import {useCanvasContext, useMenuContext} from "../../hooks";
import {useCallback, useEffect, useRef} from "react";
import {create, draw, done} from "../ToolsHandler";

function MouseHandler() {
    const {canvas, setZoomRatio} = useCanvasContext();
    const {lockStatus, activeTool, setActiveTool} = useMenuContext();
    const isDown = useRef(false);

    const handleMouseDown = (e) => {
        if (TOOL_FUNCTIONS[activeTool].createOnClick) {
            canvas.selection = false;
            canvas.discardActiveObject();
            create(activeTool, canvas, e);
        }
    };

    const handleMouseMove = (e) => {
        if (TOOL_FUNCTIONS[activeTool].onMove) {
            canvas.selection = false;
            draw(activeTool, canvas, e);
        }
        canvas.renderAll();
    }

    const handleMouseUp = () => {
        // sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
        if (TOOL_FUNCTIONS[activeTool].createOnClick) {
            done(activeTool, canvas);
            const currentDrawnObject = canvas.item(canvas.getObjects().length - 1);
            if (currentDrawnObject && activeTool !== TOOL_CONSTANTS.ERASER) {
                if (!lockStatus) {
                    canvas.setActiveObject(currentDrawnObject);
                    setActiveTool(TOOL_CONSTANTS.CURSOR);
                } else {
                    currentDrawnObject.selectable = false;
                }
            }
            canvas.renderAll();
        }
    }

    const onMouseWheel = useCallback((event) => {
        if (canvas && event.e.ctrlKey) {
            const delta = event.e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta
            if (zoom > 20) zoom = 20;
            if (zoom < 0.01) zoom = 0.01;
            setZoomRatio(zoom);
        }
        event.e.preventDefault()
        event.e.stopPropagation()
    }, [canvas]);

    useEffect(() => {
        if (canvas) {
            canvas.on('mouse:down', function (e) {
                isDown.current = true;
                handleMouseDown(e);
            });

            canvas.on('mouse:move', function (e) {
                if (!isDown.current) return;
                handleMouseMove(e);
            });

            canvas.on('mouse:up', () => {
                isDown.current = false;
                handleMouseUp();
            });

            canvas.on("mouse:wheel", onMouseWheel);

        }
        return () => {
            if (canvas) {
                canvas.off("mouse:down");
                canvas.off("mouse:move");
                canvas.off("mouse:up");
                canvas.off("mouse:wheel");
            }
        }

    }, [canvas, activeTool, lockStatus]);
}

export default MouseHandler;