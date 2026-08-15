import { useEffect } from "react";
import { useCanvasContext } from "../../hooks";
import {
  beginLabelEditing,
  finishLabelEditing,
  isLabelableShape,
  isLabeledShape,
  normalizeLabeledGroupScale,
} from "../../utils/shapeLabel";

// Double-click a basic shape (or an already-labelled shape) to add/edit a
// centred text label that lives and moves with it. Registered *before*
// TextEventHandler so its text:editing:exited runs first — it regroups the
// shape + text (or drops an empty label) inside one suppressed history window,
// so the generic empty-text cleanup never records a stray undo step.
function LabelHandler() {
  const { canvas } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return undefined;

    const onDblClick = (opt) => {
      const target = opt.target;
      if (!target) return;
      if (isLabeledShape(target) || isLabelableShape(target)) {
        beginLabelEditing(canvas, target);
      }
    };

    const onEditingExited = () => finishLabelEditing(canvas);

    // Keep a resized label's border at its true width (see the helper). Runs
    // after fabric-history's own object:modified handler, so it can re-point the
    // history baseline at the normalised result.
    const onModified = (opt) => {
      const target = opt && opt.target;
      if (isLabeledShape(target)) normalizeLabeledGroupScale(canvas, target);
    };

    canvas.on("mouse:dblclick", onDblClick);
    canvas.on("text:editing:exited", onEditingExited);
    canvas.on("object:modified", onModified);

    return () => {
      canvas.off("mouse:dblclick", onDblClick);
      canvas.off("text:editing:exited", onEditingExited);
      canvas.off("object:modified", onModified);
    };
  }, [canvas]);
}

export default LabelHandler;
