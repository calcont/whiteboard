import { useEffect } from "react";
import { useCanvasContext } from "../../hooks";
import { isArrow } from "../../utils/shapeLabel";
import {
  boundArrows,
  rerouteArrow,
  shapeUnderPoint,
  arrowEndScene,
  bindEnd,
  unbindEnd,
} from "../../utils/binding";
import {
  showBindHighlight,
  clearBindHighlight,
} from "../../utils/bindingHighlight";

// Keeps bound arrows glued to their shapes and drives endpoint (re)binding.
function ArrowBindingHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return undefined;

    // A shape with bound arrows moved/resized -> re-route those arrows live. We
    // react to object:moving/scaling (not object:modified) so the final
    // positions are in place when fabric-history snapshots on drop — undo
    // restores shape + arrows together with no extra history plumbing.
    const onShapeChange = (opt) => {
      const t = opt && opt.target;
      if (!t || isArrow(t) || t.type === "activeSelection" || !t.id) return;
      const arrows = boundArrows(canvas, t.id);
      if (!arrows.length) return;
      arrows.forEach((a) => rerouteArrow(canvas, a));
      canvas.requestRenderAll();
    };

    // The other (already-bound) end's shape, so we can highlight the source too.
    const otherShape = (arrow, end) => {
      const id = end === "start" ? arrow.endBinding : arrow.startBinding;
      return id ? canvas.getObjects().find((o) => o.id === id) : null;
    };

    // Dragging an arrow endpoint: highlight the shape it's over (+ the source).
    const onEndpointMoving = (opt) => {
      const { arrow, end } = opt || {};
      if (!arrow) return;
      const p = arrowEndScene(arrow, end);
      const target = shapeUnderPoint(canvas, p, [arrow]);
      showBindHighlight(canvas, [target, otherShape(arrow, end)]);
    };

    // Dropping an arrow endpoint: bind it if over a shape, else unbind it.
    const onEndpointUp = (opt) => {
      const { arrow, end } = opt || {};
      if (!arrow) return;
      clearBindHighlight(canvas);
      const p = arrowEndScene(arrow, end);
      const target = shapeUnderPoint(canvas, p, [arrow]);
      if (target) bindEnd(arrow, end, target, p);
      else unbindEnd(arrow, end);
      rerouteArrow(canvas, arrow);
      canvas.requestRenderAll();
    };

    canvas.on("object:moving", onShapeChange);
    canvas.on("object:scaling", onShapeChange);
    canvas.on("arrow:endpoint:moving", onEndpointMoving);
    canvas.on("arrow:endpoint:up", onEndpointUp);
    return () => {
      canvas.off("object:moving", onShapeChange);
      canvas.off("object:scaling", onShapeChange);
      canvas.off("arrow:endpoint:moving", onEndpointMoving);
      canvas.off("arrow:endpoint:up", onEndpointUp);
    };
  }, [canvas]);
}

export default ArrowBindingHandler;
