import Menu from './components/Menu';
import Whiteboard from './components/Whiteboard';
import React, {useEffect, useRef, useState} from "react";
import {fabric} from "fabric";

function App() {
    const canvasRef = useRef(null);
    const canvas = useRef(null);
    const [canvasState, setCanvasState] = useState(null);

    useEffect(() => {
        canvas.current = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: false,
            selection: false,
        });
        canvas.current.setWidth(window.screen.width);
        canvas.current.setHeight(window.screen.height);
        setCanvasState(canvas.current);
    }, []);

    return (
        <div>
            {canvasState && <Menu canvas={canvasState}/>}
            <canvas ref={canvasRef} id='canvas'>Drawing canvas</canvas>
        </div>
    );
}

export default App;
