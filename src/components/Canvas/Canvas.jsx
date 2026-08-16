import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";
import "fabric-history";
import { useCanvasContext } from "../../hooks/";
import { enableRoughRendering } from "../../utils/roughRender";

// Swap the basic shapes' render for a hand-drawn (rough.js) one, once.
enableRoughRendering();
import {
  MouseHandler,
  KeyBoardHandler,
  SelectionHandler,
  LabelHandler,
  LineEndpointHandler,
  TextEventHandler,
  ZoomHandler,
  PersistenceHandler,
  ArrowResizeHandler,
  DarkColorHandler,
} from "../../Handlers/EventHandlers";

function Canvas() {
  MouseHandler();
  KeyBoardHandler();
  SelectionHandler();
  // Before TextEventHandler: its text:editing:exited must run first so the
  // shape+text regroup happens before the generic empty-text cleanup.
  LabelHandler();
  LineEndpointHandler();
  TextEventHandler();
  ZoomHandler();
  PersistenceHandler();
  ArrowResizeHandler();
  DarkColorHandler();
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
      // A few px of slack when per-pixel target finding is on (arrows), so a
      // thin 3px line is still easy to click. Only consulted for objects with
      // perPixelTargetFind, so bbox selection of shapes is unaffected.
      targetFindTolerance: 5,
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
