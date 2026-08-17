import { useEffect } from "react";
import { useCanvasContext } from "../../hooks";
import { isArrow } from "../../utils/shapeLabel";
import { boundArrows, rerouteArrow } from "../../utils/binding";

// Keep bound arrows glued to their shapes: when a shape with bound arrows is
// dragged or resized, re-route those arrows live to the shape's border. We react
// to object:moving / object:scaling (not object:modified) so the re-routing is
// live during the gesture AND the final positions are already in place when
// fabric-history snapshots on drop — so undo restores shape + arrows together
// without extra history plumbing.
function ArrowBindingHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return undefined;

    const onShapeChange = (opt) => {
      const t = opt && opt.target;
      // Single bound shape only for v1 — multi-select re-route is a follow-up.
      if (!t || isArrow(t) || t.type === "activeSelection" || !t.id) return;
      const arrows = boundArrows(canvas, t.id);
      if (!arrows.length) return;
      arrows.forEach((a) => rerouteArrow(canvas, a));
      canvas.requestRenderAll();
    };

    canvas.on("object:moving", onShapeChange);
    canvas.on("object:scaling", onShapeChange);
    return () => {
      canvas.off("object:moving", onShapeChange);
      canvas.off("object:scaling", onShapeChange);
    };
  }, [canvas]);
}

export default ArrowBindingHandler;
