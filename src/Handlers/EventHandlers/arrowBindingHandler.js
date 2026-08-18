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

    // Shape(s) with bound arrows moved/resized -> re-route those arrows live. We
    // react to object:moving/scaling (not object:modified) so the final
    // positions are in place when fabric-history snapshots on drop — undo
    // restores shape + arrows together with no extra history plumbing. A
    // multi-select drag reports the target as an activeSelection, so fan out to
    // every selected shape (else arrows between selected shapes are left behind).
    const onShapeChange = (opt) => {
      const t = opt && opt.target;
      if (!t || isArrow(t)) return;
      const shapes = t.type === "activeSelection" ? t.getObjects() : [t];
      const arrows = new Set();
      shapes.forEach((s) => {
        if (s && s.id) boundArrows(canvas, s.id).forEach((a) => arrows.add(a));
      });
      if (!arrows.size) return;
      arrows.forEach((a) => rerouteArrow(canvas, a));
      canvas.requestRenderAll();
    };

    // While a bound arrow is itself being dragged, keep each bound end glued to
    // its shape's border LIVE (every frame), so the arrowhead glides on the
    // border instead of following the cursor into the shape and then snapping
    // back on release — that snap was the "padding between cursor and arrowhead".
    // refit=false: mid-drag we must NOT reset the group's bounds, or we'd fight
    // fabric's own translate (bounds are re-fitted on drop, below).
    const onArrowMoving = (opt) => {
      const t = opt && opt.target;
      if (!t || !isArrow(t) || (!t.startBinding && !t.endBinding)) return;
      rerouteArrow(canvas, t, false);
      canvas.requestRenderAll();
    };

    // On drop, re-evaluate each bound end against where it landed: still over its
    // shape -> stay glued; dragged onto a different shape -> rebind; dragged into
    // empty space -> unbind (so a bound arrow can be pulled off, not just pinned).
    // Then a final reroute re-fits the bounds.
    //
    // An endpoint drag ALSO ends in object:modified (action "arrowEndpoint") but
    // owns its own (un)binding via arrow:endpoint:up — skip it, or we'd fight it.
    const onArrowMoved = (opt) => {
      const t = opt && opt.target;
      if (!t || !isArrow(t) || (!t.startBinding && !t.endBinding)) return;
      if (opt.action === "arrowEndpoint") return;
      ["start", "end"].forEach((end) => {
        const boundId = end === "start" ? t.startBinding : t.endBinding;
        if (!boundId) return;
        const p = arrowEndScene(t, end);
        const shape = shapeUnderPoint(canvas, p, [t]);
        if (shape) bindEnd(t, end, shape, p);
        else unbindEnd(t, end);
      });
      if (t.startBinding || t.endBinding) rerouteArrow(canvas, t);
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
    canvas.on("object:moving", onArrowMoving);
    canvas.on("object:scaling", onShapeChange);
    canvas.on("object:modified", onArrowMoved);
    canvas.on("arrow:endpoint:moving", onEndpointMoving);
    canvas.on("arrow:endpoint:up", onEndpointUp);
    canvas.on("mouse:up", onMouseUp);
    return () => {
      canvas.off("object:moving", onShapeChange);
      canvas.off("object:moving", onArrowMoving);
      canvas.off("object:scaling", onShapeChange);
      canvas.off("object:modified", onArrowMoved);
      canvas.off("arrow:endpoint:moving", onEndpointMoving);
      canvas.off("arrow:endpoint:up", onEndpointUp);
      canvas.off("mouse:up", onMouseUp);
    };
  }, [canvas]);
}

export default ArrowBindingHandler;
