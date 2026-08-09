import { useEffect } from "react";
import { fabric } from "fabric";
import { useCanvasContext } from "../../hooks";
import { buildArrowGroup } from "../ToolsHandler/tools/arrow";

// An arrow is a group of exactly a line + a path (the head).
const isArrowGroup = (o) =>
  o &&
  o.type === "group" &&
  o._objects &&
  o._objects.length === 2 &&
  o._objects.some((c) => c.type === "line") &&
  o._objects.some((c) => c.type === "path");

// Resizing an arrow scales the whole group, which stretches and distorts the
// arrowhead. Instead, after a scale we rebuild the arrow between its real
// endpoints with a fixed-size head and unscaled stroke — length/direction
// change, the head stays constant.
function ArrowResizeHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return undefined;
    let rebuilding = false;

    // While the arrow is being dragged, fabric scales the whole group so the
    // head balloons/distorts until the drag ends (when onModified rebuilds it).
    // Counter-scale the head child every scaling frame so it stays a constant
    // size live; the line's stroke already stays constant via strokeUniform.
    const onScaling = (e) => {
      const group = e && e.target;
      if (rebuilding || !isArrowGroup(group)) return;
      const head = group._objects.find((c) => c.type === "path");
      if (!head) return;
      // Use |scale| so the head keeps a constant size AND mirrors together with
      // the line when the group is flipped (a corner dragged past the opposite
      // corner) — otherwise the line would mirror while the head stayed put.
      head.scaleX = 1 / Math.abs(group.scaleX || 1);
      head.scaleY = 1 / Math.abs(group.scaleY || 1);
    };

    const onModified = (e) => {
      const group = e && e.target;
      if (rebuilding || !isArrowGroup(group)) return;
      // Only act on an actual scale — a plain move/rotate needs no rebuild.
      if (
        (group.scaleX == null || group.scaleX === 1) &&
        (group.scaleY == null || group.scaleY === 1)
      ) {
        return;
      }

      const head = group._objects.find((c) => c.type === "path");
      const line = group._objects.find((c) => c.type === "line");
      const matrix = group.calcTransformMatrix();
      // The head sits at the arrow tip; its absolute centre is the new tip.
      const tip = fabric.util.transformPoint(
        new fabric.Point(head.left, head.top),
        matrix,
      );
      // The tail is the line's OTHER endpoint. Derive it from the line's real
      // endpoints — NOT the group's bounding box: the head inflates the bbox, so
      // an opposite-corner tail sits off the line and tilts a horizontal arrow
      // on drop. calcLinePoints() is relative to the line's centre; add the
      // line's left/top (relative to the group centre) then map to absolute.
      const lp = line.calcLinePoints();
      const end1 = fabric.util.transformPoint(
        new fabric.Point(line.left + lp.x1, line.top + lp.y1),
        matrix,
      );
      const end2 = fabric.util.transformPoint(
        new fabric.Point(line.left + lp.x2, line.top + lp.y2),
        matrix,
      );
      const tail =
        Math.hypot(end1.x - tip.x, end1.y - tip.y) >
        Math.hypot(end2.x - tip.x, end2.y - tip.y)
          ? end1
          : end2;

      const style = {
        stroke: line.stroke,
        strokeWidth: line.strokeWidth,
        strokeDashArray: line.strokeDashArray,
      };

      rebuilding = true;
      const supportsHistory = typeof canvas._historySaveAction === "function";
      if (supportsHistory) canvas.historyProcessing = true;

      const arrow = buildArrowGroup(
        { x: tail.x, y: tail.y },
        { x: tip.x, y: tip.y },
        style,
      );
      canvas.remove(group);
      canvas.add(arrow);
      arrow.setCoords();
      canvas.setActiveObject(arrow);
      canvas.requestRenderAll();

      if (supportsHistory) {
        canvas.historyProcessing = false;
        // fabric-history already pushed the pre-resize state for undo; point the
        // baseline at the rebuilt arrow so redo/next-save use the clean version,
        // not the scaled one.
        canvas.historyNextState = canvas._historyNext();
      }
      rebuilding = false;
    };

    canvas.on("object:scaling", onScaling);
    canvas.on("object:modified", onModified);
    return () => {
      canvas.off("object:scaling", onScaling);
      canvas.off("object:modified", onModified);
    };
  }, [canvas]);
}

export default ArrowResizeHandler;
