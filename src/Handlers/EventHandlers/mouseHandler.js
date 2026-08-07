import { TOOL_CONSTANTS, TOOL_FUNCTIONS } from "../../constants";
import { useCanvasContext, useMenuContext } from "../../hooks";
import { useCallback, useEffect, useRef } from "react";
import { create, draw, done } from "../ToolsHandler";

function MouseHandler() {
  const { canvas, setZoomRatio } = useCanvasContext();
  const { lockStatus, activeTool, setActiveTool } = useMenuContext();
  const isDown = useRef(false);
  const historyBatching = useRef(false);
  const opStartCount = useRef(0);

  // A single draw gesture can add/remove several fabric objects internally
  // (e.g. the arrow adds a line + head, then swaps them for a group; the
  // eraser removes many). fabric-history records one snapshot per event, so
  // those show up as several undo steps. Batch the whole gesture into one:
  // suppress per-object snapshots between mouse-down and mouse-up, then record
  // a single entry if the canvas actually changed.
  const beginHistoryBatch = () => {
    if (typeof canvas._historySaveAction !== "function") return;
    opStartCount.current = canvas.getObjects().length;
    canvas.historyProcessing = true;
    historyBatching.current = true;
  };

  const endHistoryBatch = () => {
    if (!historyBatching.current) return;
    historyBatching.current = false;
    canvas.historyProcessing = false;
    if (canvas.getObjects().length !== opStartCount.current) {
      canvas._historySaveAction();
    } else {
      // Nothing net-changed (e.g. an accidental click was discarded); keep the
      // baseline in sync so the next real action records correctly.
      canvas.historyNextState = canvas._historyNext();
    }
  };

  const handleMouseDown = (e) => {
    if (TOOL_FUNCTIONS[activeTool].createOnClick) {
      beginHistoryBatch();
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
  };

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
      endHistoryBatch();
      canvas.renderAll();
    }
  };

  const onMouseWheel = useCallback(
    (event) => {
      if (canvas && event.e.ctrlKey) {
        const delta = event.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        setZoomRatio(zoom);
      }
      event.e.preventDefault();
      event.e.stopPropagation();
    },
    [canvas],
  );

  useEffect(() => {
    if (canvas) {
      canvas.on("mouse:down", function (e) {
        isDown.current = true;
        handleMouseDown(e);
      });

      canvas.on("mouse:move", function (e) {
        if (!isDown.current) return;
        handleMouseMove(e);
      });

      canvas.on("mouse:up", () => {
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
    };
  }, [canvas, activeTool, lockStatus]);
}

export default MouseHandler;
