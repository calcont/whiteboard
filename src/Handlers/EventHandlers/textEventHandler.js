import { useCanvasContext } from "../../hooks";
import { useEffect } from "react";

// Exported so the behaviour can be unit-tested without rendering the hook.
// On entry: disable rubber-band selection and hide the object border so only
// the blinking cursor shows while typing (excalidraw-style).
export const handleTextEditingEntered = (canvas, e) => {
  if (!e || !e.target) return;
  canvas.selection = false;
  e.target.set({ hasBorders: false });
};

// On exit: restore selection (otherwise box-selecting shapes silently stops
// working after any text/label edit) and the border, and drop an empty text.
export const handleTextEditingExited = (canvas, e) => {
  canvas.selection = true;
  if (e && e.target) e.target.set({ hasBorders: true });
  if (e && e.target && e.target.text === "") {
    canvas.remove(e.target);
    canvas.renderAll();
  }
};

function TextEventHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return;
    const onEntered = (e) => handleTextEditingEntered(canvas, e);
    const onExited = (e) => handleTextEditingExited(canvas, e);
    canvas.on("text:editing:entered", onEntered);
    canvas.on("text:editing:exited", onExited);

    return () => {
      if (!canvas) return;
      canvas.off("text:editing:entered", onEntered);
      canvas.off("text:editing:exited", onExited);
    };
  }, [canvas]);
}

export default TextEventHandler;
