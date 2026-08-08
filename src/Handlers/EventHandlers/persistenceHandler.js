import { useEffect, useRef } from "react";
import { useCanvasContext } from "../../hooks";
import { loadScene, saveScene } from "../../utils/storage";

const SAVE_DEBOUNCE_MS = 800;

// Restores the board from IndexedDB on load and auto-saves (debounced) on
// every change, so a refresh doesn't lose work.
function PersistenceHandler() {
  const { canvas } = useCanvasContext();
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!canvas) return undefined;
    let disposed = false;

    loadScene().then((scene) => {
      if (disposed || !scene) return;
      canvas.loadFromJSON(scene, () => {
        // Restored objects should be selectable once the cursor tool is used.
        canvas.getObjects().forEach((obj) => obj.set({ selectable: true }));
        canvas.renderAll();
        // Reset the history baseline so the restored scene is the starting
        // point — otherwise an undo would wipe it back to empty.
        if (Array.isArray(canvas.historyUndo)) {
          canvas.historyUndo = [];
          canvas.historyRedo = [];
          canvas.historyNextState = canvas._historyNext();
        }
      });
    });

    const scheduleSave = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveScene(canvas.toJSON());
      }, SAVE_DEBOUNCE_MS);
    };

    const events = [
      "object:added",
      "object:modified",
      "object:removed",
      "path:created",
      "background:changed", // fired by the background-color tool
    ];
    events.forEach((ev) => canvas.on(ev, scheduleSave));

    return () => {
      disposed = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      events.forEach((ev) => canvas.off(ev, scheduleSave));
    };
  }, [canvas]);
}

export default PersistenceHandler;
