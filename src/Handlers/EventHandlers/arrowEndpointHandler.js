import { useEffect } from "react";
import { useCanvasContext } from "../../hooks";
import { isArrow } from "../../utils/shapeLabel";
import { attachEndpointControls } from "../../utils/arrowEndpoints";

// Give a selected arrow its endpoint drag-handles back. buildArrowGroup installs
// them (plus hasBorders:false / perPixelTargetFind), but controls aren't
// serialized — so an arrow restored from a saved scene, or rebuilt by an
// undo/redo loadFromJSON, would otherwise show default bbox handles in the wrong
// spots. Re-attaching on selection covers every load path (mirrors
// LineEndpointHandler).
function ArrowEndpointHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return undefined;
    const onSelect = () => {
      const t = canvas.getActiveObject();
      if (t && isArrow(t) && !t.group) {
        attachEndpointControls(t);
        t.set({ perPixelTargetFind: true, objectCaching: false });
      }
    };
    canvas.on("selection:created", onSelect);
    canvas.on("selection:updated", onSelect);
    return () => {
      canvas.off("selection:created", onSelect);
      canvas.off("selection:updated", onSelect);
    };
  }, [canvas]);
}

export default ArrowEndpointHandler;
