import { useEffect } from "react";
import { useCanvasContext } from "../../hooks";
import { attachLineEndpointControls } from "../../utils/lineEndpoints";

// Give a selected top-level line the drag-to-extend endpoint handles (like
// arrows). Done on selection so it covers both freshly-drawn lines and lines
// restored from a saved scene. Arrow line-children (inside a group) are skipped
// — they have a `group`, and only the arrow's own endpoint controls apply.
function LineEndpointHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return undefined;
    const onSelect = () => {
      const t = canvas.getActiveObject();
      if (t && t.type === "line" && !t.group) attachLineEndpointControls(t);
    };
    canvas.on("selection:created", onSelect);
    canvas.on("selection:updated", onSelect);
    return () => {
      canvas.off("selection:created", onSelect);
      canvas.off("selection:updated", onSelect);
    };
  }, [canvas]);
}

export default LineEndpointHandler;
