import { useEffect } from "react";
import { useCanvasContext } from "../../hooks";

function SelectionHandler() {
  const { canvas, setActiveObject } = useCanvasContext();

  function onSelect(object) {
    if (object?.selected) {
      if (canvas) {
        setActiveObject(canvas.getActiveObject());
      } else {
        setActiveObject(null);
      }
    } else {
      setActiveObject(null);
    }
  }

  useEffect(() => {
    if (canvas) {
      canvas.on("selection:created", onSelect);
      canvas.on("selection:cleared", onSelect);
      canvas.on("selection:updated", onSelect);
    }
    return () => {
      if (canvas) {
        canvas.off("selection:cleared", onSelect);
        canvas.off("selection:created", onSelect);
        canvas.off("selection:updated", onSelect);
      }
    };
  }, [canvas]);
}

export default SelectionHandler;
