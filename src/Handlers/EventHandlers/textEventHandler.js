import { useCanvasContext } from "../../hooks";
import { useEffect } from "react";

function TextEventHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return;
    canvas.on("text:editing:entered", function (e) {
      if (e.target) {
        canvas.selection = false;
        // Excalidraw-style: while typing show only the blinking cursor, not a
        // box around the text. fabric draws the active object's border
        // (borderColor) even mid-edit, so drop it outright — the cursor is
        // rendered separately and stays. Restored on exit.
        e.target.set({ hasBorders: false });
      }
    });

    canvas.on("text:editing:exited", function (e) {
      // Re-enable rubber-band selection, disabled on entry above. Without this
      // it stays off after any text/label edit until the next tool switch, so
      // box-selecting shapes silently stops working.
      canvas.selection = true;
      if (e.target) e.target.set({ hasBorders: true });
      if (e.target.text === "") {
        canvas.remove(e.target);
        canvas.renderAll();
      }
    });

    return () => {
      if (!canvas) return;
      canvas.off("text:editing:entered");
      canvas.off("text:editing:exited");
    };
  }, [canvas]);
}

export default TextEventHandler;
