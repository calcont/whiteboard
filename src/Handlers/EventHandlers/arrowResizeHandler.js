import { useEffect } from "react";
import { fabric } from "fabric";
import { useCanvasContext } from "../../hooks";
import { buildArrowGroup } from "../ToolsHandler/tools/arrow";
import { isArrow, counterScaleArrowDecorations } from "../../utils/shapeLabel";

// Arrow detection (line + 1-2 heads, optional text label) is centralised in
// shapeLabel's isArrow — single source of truth shared with the properties
// panel and the label editor.

const isScaled = (o) =>
  (o.scaleX != null && o.scaleX !== 1) || (o.scaleY != null && o.scaleY !== 1);

// Resizing an arrow scales the whole group, which stretches and distorts the
// arrowhead. Instead, after a scale we rebuild the arrow between its real
// endpoints with a fixed-size head and unscaled stroke — length/direction
// change, the head stays constant.
function ArrowResizeHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return undefined;
    let rebuilding = false;

    // Rebuild one scaled arrow group at scale 1 between its real endpoints,
    // preserving its head config (single vs double). Returns the fresh arrow
    // (already swapped onto the canvas).
    const rebuildScaledArrow = (group) => {
      const line = group._objects.find((c) => c.type === "line");
      const heads = group._objects.filter((c) => c.type === "path");
      const textChild = group._objects.find(
        (c) => c.type === "textbox" || c.type === "i-text" || c.type === "text",
      );
      const matrix = group.calcTransformMatrix();
      // Derive both endpoints from the line's real endpoints — NOT the group's
      // bounding box: a head inflates the bbox, so an opposite-corner tail sits
      // off the line and tilts a horizontal arrow on drop. calcLinePoints() is
      // relative to the line's centre; add its left/top (relative to the group
      // centre) then map to absolute.
      const lp = line.calcLinePoints();
      const end1 = fabric.util.transformPoint(
        new fabric.Point(line.left + lp.x1, line.top + lp.y1),
        matrix,
      );
      const end2 = fabric.util.transformPoint(
        new fabric.Point(line.left + lp.x2, line.top + lp.y2),
        matrix,
      );

      let tail;
      let tip;
      if (heads.length === 2) {
        // Double-headed: symmetric, so either endpoint can be the "end".
        tail = end1;
        tip = end2;
      } else {
        // Single-headed: the tip is the endpoint nearest the head.
        const headAbs = fabric.util.transformPoint(
          new fabric.Point(heads[0].left, heads[0].top),
          matrix,
        );
        const d1 = Math.hypot(end1.x - headAbs.x, end1.y - headAbs.y);
        const d2 = Math.hypot(end2.x - headAbs.x, end2.y - headAbs.y);
        tip = d1 < d2 ? end1 : end2;
        tail = d1 < d2 ? end2 : end1;
      }

      const arrow = buildArrowGroup(
        { x: tail.x, y: tail.y },
        { x: tip.x, y: tip.y },
        {
          stroke: line.stroke,
          strokeWidth: line.strokeWidth,
          strokeDashArray: line.strokeDashArray,
          heads: heads.length === 2 ? "both" : "end",
          // Preserve a label across the rebuild, re-centred on the new midpoint.
          label: textChild
            ? {
                text: textChild.text,
                fontFamily: textChild.fontFamily,
                fontSize: textChild.fontSize,
                fill: textChild.fill,
                backgroundColor: textChild.backgroundColor,
              }
            : null,
        },
      );
      canvas.remove(group);
      canvas.add(arrow);
      arrow.setCoords();
      return arrow;
    };

    // While the arrow is being dragged, fabric scales the whole group so the
    // head balloons/distorts until the drag ends (when onModified rebuilds it).
    // Counter-scale the head child every scaling frame so it stays a constant
    // size live; the line's stroke already stays constant via strokeUniform.
    const onScaling = (e) => {
      const group = e && e.target;
      if (rebuilding || !isArrow(group)) return;
      // Keep the head(s) AND the text label a constant size while dragging;
      // only the line stretches. (See counterScaleArrowDecorations.)
      counterScaleArrowDecorations(group);
    };

    const onModified = (e) => {
      const target = e && e.target;
      if (rebuilding || !target) return;

      // Which arrow group(s) were scaled and need rebuilding to scale 1?
      // strokeUniform keeps a line's stroke constant against its OWN scale, but
      // an arrow is a group and the line's stroke still follows the *group's*
      // scale — so a scaled arrow renders a thick/thin line until rebuilt. This
      // bites both a single arrow AND arrows caught in a scaled multi-selection
      // (fabric bakes the selection's scale into each child on discard).
      let toRebuild = [];
      let members = null;
      if (isArrow(target)) {
        if (!isScaled(target)) return; // plain move/rotate needs no rebuild
        toRebuild = [target];
      } else if (target.type === "activeSelection") {
        if (!isScaled(target)) return;
        members = target._objects.slice();
        if (!members.some(isArrow)) return;
        // Disband the selection first so each child's scale is baked in, then
        // rebuild whichever arrows ended up scaled.
        canvas.discardActiveObject();
        toRebuild = members.filter((o) => isArrow(o) && isScaled(o));
        if (!toRebuild.length) return;
      } else {
        return;
      }

      rebuilding = true;
      const supportsHistory = typeof canvas._historySaveAction === "function";
      if (supportsHistory) canvas.historyProcessing = true;

      const rebuilt = new Map();
      toRebuild.forEach((g) => rebuilt.set(g, rebuildScaledArrow(g)));

      // Restore the selection state: single arrow stays selected; a
      // multi-selection is re-formed with the rebuilt arrows swapped in.
      if (members) {
        const next = members.map((o) => rebuilt.get(o) || o);
        if (next.length > 1) {
          canvas.setActiveObject(new fabric.ActiveSelection(next, { canvas }));
        } else if (next.length === 1) {
          canvas.setActiveObject(next[0]);
        }
      } else {
        canvas.setActiveObject(rebuilt.get(target));
      }
      canvas.requestRenderAll();

      if (supportsHistory) {
        canvas.historyProcessing = false;
        // fabric-history already pushed the pre-resize state for undo; point the
        // baseline at the rebuilt arrows so redo/next-save use the clean version.
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
