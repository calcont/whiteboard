import React, {useEffect, useRef} from "react";
import {fabric} from "fabric";
import {useCanvasContext} from "../../hooks/";
import {
    MouseHandler,
    KeyBoardHandler,
    SelectionHandler
} from "../../Handlers/EventHandlers";

function Canvas() {
    MouseHandler();
    KeyBoardHandler();
    SelectionHandler();
    const canvasRef = useRef(null);
    const {setCanvas} = useCanvasContext();

    useEffect(() => {
        const canvas = new fabric.Canvas('canvas', {
            isDrawingMode: false,
            selection: true,
            height: window.screen.height,
            width: window.screen.width,
        });
        setCanvas(canvas);
        return () => {
            canvas.dispose();
        }
    }, []);

    return (
        <canvas ref={canvasRef} id='canvas'>Drawing canvas</canvas>
    );
}

export default Canvas;
