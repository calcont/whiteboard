import { useCanvasContext } from "../../hooks";
import { useEffect } from "react";

function TextEventHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return;
    canvas.on("text:editing:entered", function (e) {
      if (e.target) {
        canvas.selection = false;
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
