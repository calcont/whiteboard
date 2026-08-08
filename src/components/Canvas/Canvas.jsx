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
  PersistenceHandler,
} from "../../Handlers/EventHandlers";

function Canvas() {
  MouseHandler();
  KeyBoardHandler();
  SelectionHandler();
  TextEventHandler();
  ZoomHandler();
  PersistenceHandler();
  const canvasRef = useRef(null);
  const { setCanvas } = useCanvasContext();

  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      isDrawingMode: false,
      selection: true,
      // Keep z-order stable while an object is selected. Without this fabric
      // renders the active object on top, so selecting a filled shape that
      // sits under text (or another shape) hides what's above it.
      preserveObjectStacking: true,
      height: window.screen.height,
      width: window.screen.width,
    });
    // fabric-history already runs _historyInit() from its overridden
    // Canvas.initialize(); calling it again here double-binds the history
    // event handlers, so every change recorded two snapshots and undo/redo
    // needed two presses per action. Rely on the single init from the lib.
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
