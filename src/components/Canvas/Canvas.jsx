import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";
import "fabric-history";
import { useCanvasContext } from "../../hooks/";
import {
  MouseHandler,
  KeyBoardHandler,
  SelectionHandler,
  TextEventHandler,
  ZoomHandler,
} from "../../Handlers/EventHandlers";

function Canvas() {
  MouseHandler();
  KeyBoardHandler();
  SelectionHandler();
  TextEventHandler();
  ZoomHandler();
  const canvasRef = useRef(null);
  const { setCanvas } = useCanvasContext();

  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      isDrawingMode: false,
      selection: true,
      height: window.screen.height,
      width: window.screen.width,
    });
    canvas._historyInit();
    setCanvas(canvas);
    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <canvas ref={canvasRef} id="canvas">
      Drawing canvas
    </canvas>
  );
}

export default Canvas;
