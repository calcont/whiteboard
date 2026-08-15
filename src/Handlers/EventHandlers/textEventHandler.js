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
        // box around the text. (fabric draws editingBorderColor otherwise.)
        e.target.set({ editingBorderColor: "transparent" });
      }
    });

    canvas.on("text:editing:exited", function (e) {
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
