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

    // A bound arrow that is itself moved/nudged (even a click that registers a
    // tiny drag) would otherwise drag its bound end off into empty space — the
    // "it goes to a different position" bug. On drop, snap any bound end back onto
    // its shape; the free end keeps wherever the drag left it. We reroute on
    // object:modified (drop), not live: mid-drag the reroute would fight fabric's
    // own translation of the very group being dragged.
    const onArrowMoved = (opt) => {
      const t = opt && opt.target;
      if (!t || !isArrow(t) || (!t.startBinding && !t.endBinding)) return;
      rerouteArrow(canvas, t);
      canvas.requestRenderAll();
    };

    // Dragging ONE endpoint: highlight only the shape THAT endpoint is over
    // (the other end isn't changing, so highlighting it too just adds clutter).
    const onEndpointMoving = (opt) => {
      const { arrow, end } = opt || {};
      if (!arrow) return;
      const p = arrowEndScene(arrow, end);
      showBindHighlight(canvas, shapeUnderPoint(canvas, p, [arrow]));
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

    // Catch-all: any mouse release clears a stray highlight, so it can never
    // get stuck (e.g. if an endpoint drag ends without its control's mouse-up).
    const onMouseUp = () => clearBindHighlight(canvas);

    canvas.on("object:moving", onShapeChange);
    canvas.on("object:scaling", onShapeChange);
    canvas.on("object:modified", onArrowMoved);
    canvas.on("arrow:endpoint:moving", onEndpointMoving);
    canvas.on("arrow:endpoint:up", onEndpointUp);
    canvas.on("mouse:up", onMouseUp);
    return () => {
      canvas.off("object:moving", onShapeChange);
      canvas.off("object:scaling", onShapeChange);
      canvas.off("object:modified", onArrowMoved);
      canvas.off("arrow:endpoint:moving", onEndpointMoving);
      canvas.off("arrow:endpoint:up", onEndpointUp);
      canvas.off("mouse:up", onMouseUp);
    };
  }, [canvas]);
}

export default ArrowBindingHandler;
