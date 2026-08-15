import { fabric } from "fabric";
import { resolveTextStyle } from "../Handlers/ToolsHandler/toolStyle";

// Basic shapes that can carry a centred text label. Arrows (line + path groups)
// and imported icons (multi-path groups) are intentionally excluded.
const LABELABLE_TYPES = new Set(["rect", "ellipse", "triangle", "polygon"]);
const TEXT_TYPES = new Set(["textbox", "i-text", "text"]);

export const isLabelableShape = (o) => !!o && LABELABLE_TYPES.has(o.type);

// A labelled shape is a group of exactly one basic shape + one text object.
// Detected structurally (no custom props) so it survives undo and reload the
// same way arrows are recognised — see isArrowObject in PropertiesPanel.
export const isLabeledShape = (o) => {
  if (!o || o.type !== "group" || !o._objects || o._objects.length !== 2)
    return false;
  const shapes = o._objects.filter((c) => LABELABLE_TYPES.has(c.type));
  const texts = o._objects.filter((c) => TEXT_TYPES.has(c.type));
  return shapes.length === 1 && texts.length === 1;
};

export const getLabelParts = (group) => ({
  shape: group._objects.find((c) => LABELABLE_TYPES.has(c.type)),
  text: group._objects.find((c) => TEXT_TYPES.has(c.type)),
});

// Run structural mutations without recording intermediate history snapshots,
// then record a single one (or just resync the baseline when nothing changed) —
// the same batching the mouse draw gesture uses to keep one undo step.
const runLabelMutation = (canvas, record, fn) => {
  const canBatch = typeof canvas._historySaveAction === "function";
  if (canBatch) canvas.historyProcessing = true;
  try {
    fn();
  } finally {
    if (canBatch) {
      canvas.historyProcessing = false;
      if (record) canvas._historySaveAction();
      else canvas.historyNextState = canvas._historyNext();
    }
  }
};

// Centre a text object on a shape, sized to wrap inside it.
const centreTextOnShape = (text, shape) => {
  const c = shape.getCenterPoint();
  text.set({
    left: c.x,
    top: c.y,
    originX: "center",
    originY: "center",
    textAlign: "center",
  });
  text.setCoords();
};

// Begin editing a shape's label. Works for a bare shape (creates the text) and
// for an existing labelled group (disbands it so the child text is directly
// editable — fabric can't edit a text that's inside a group). The pending
// {shape, text} is stashed on the canvas; finishLabelEditing regroups on exit.
export const beginLabelEditing = (canvas, target) => {
  let shape;
  let text;
  let original = "";
  // Capture the stacking position now, before disbanding moves things around,
  // so finishLabelEditing can drop the regrouped label back where it was.
  const zIndex = canvas.getObjects().indexOf(target);

  if (isLabeledShape(target)) {
    const parts = getLabelParts(target);
    shape = parts.shape;
    text = parts.text;
    original = text.text || "";
    // Disband into absolute-positioned, independently-editable children. This
    // doesn't change what's on screen, so keep it out of the undo history —
    // and crucially leave the history baseline pointing at the pre-edit state
    // (the intact group), so finishLabelEditing records a single clean step.
    const canBatch = typeof canvas._historySaveAction === "function";
    if (canBatch) canvas.historyProcessing = true;
    target.toActiveSelection();
    canvas.discardActiveObject();
    if (canBatch) canvas.historyProcessing = false;
  } else if (isLabelableShape(target)) {
    shape = target;
    text = new fabric.Textbox("", {
      ...resolveTextStyle(canvas),
      width: Math.max(shape.getScaledWidth() * 0.85, 40),
      textAlign: "center",
    });
    centreTextOnShape(text, shape);
    // Adding the empty text is transient too — the real history entry is
    // recorded once, when editing finishes with non-empty text. Leave the
    // history baseline at the pre-label state (the bare shape).
    const canBatch = typeof canvas._historySaveAction === "function";
    if (canBatch) canvas.historyProcessing = true;
    canvas.add(text);
    if (canBatch) canvas.historyProcessing = false;
  } else {
    return false;
  }

  canvas.setActiveObject(text);
  text.enterEditing();
  if (typeof text.selectAll === "function") text.selectAll();
  canvas.__labelPending = { shape, text, original, zIndex };
  canvas.requestRenderAll();
  return true;
};

// Called when text editing exits. If this was a label edit, regroup the shape
// and text into one labelled group — or, if the label was left empty, drop the
// text and leave the bare shape. Records a single history entry only when the
// label text actually changed.
export const finishLabelEditing = (canvas) => {
  const pending = canvas.__labelPending;
  if (!pending) return;
  canvas.__labelPending = null;
  const { shape, text, original, zIndex } = pending;

  const nextText = (text.text || "").trim();
  const prevText = (original || "").trim();
  const changed = nextText !== prevText;

  runLabelMutation(canvas, changed, () => {
    if (!nextText) {
      // Empty label — drop the text, leave the bare shape. (no-op remove if the
      // generic text handler already removed it.)
      canvas.remove(text);
      canvas.setActiveObject(shape);
      return;
    }
    centreTextOnShape(text, shape);
    canvas.remove(shape);
    canvas.remove(text);
    const group = new fabric.Group([shape, text]);
    group.setCoords();
    canvas.add(group);
    // Drop the label back at the shape's original stacking position, so editing
    // a label never reorders the diagram.
    if (typeof zIndex === "number" && zIndex >= 0) canvas.moveTo(group, zIndex);
    canvas.setActiveObject(group);
  });

  // fabric's IText.exitEditing fires a trailing object:modified *after* this
  // handler returns (still inside the same exitEditing call). Left alone it
  // records a duplicate, no-op history snapshot — so swallow just that one by
  // holding historyProcessing across the synchronous tail, then releasing it.
  if (typeof canvas._historySaveAction === "function") {
    canvas.historyProcessing = true;
    setTimeout(() => {
      canvas.historyProcessing = false;
    }, 0);
  }
  canvas.requestRenderAll();
};

// After a labelled group is resized, fabric leaves the scale on the *group*,
// which multiplies the shape's border width — strokeUniform only cancels an
// object's own scale, not a parent group's — so a resized box would show a
// thicker border than an un-resized one (and than plain shapes). Re-bake it:
// disband (which pushes the group's scale down onto each child) then regroup at
// scale 1, so strokeUniform on the shape child cancels the scale and the border
// renders at its true width again. Text scales with the box as before.
export const normalizeLabeledGroupScale = (canvas, group) => {
  if (!isLabeledShape(group)) return false;
  if (Math.abs(group.scaleX - 1) < 1e-6 && Math.abs(group.scaleY - 1) < 1e-6)
    return false;

  const { shape, text } = getLabelParts(group);
  const zIndex = canvas.getObjects().indexOf(group);
  const canBatch = typeof canvas._historySaveAction === "function";
  if (canBatch) canvas.historyProcessing = true;
  try {
    // Disband bakes the group transform (incl. scale) into each child.
    group.toActiveSelection();
    canvas.discardActiveObject();
    canvas.remove(shape);
    canvas.remove(text);
    const regrouped = new fabric.Group([shape, text]);
    regrouped.setCoords();
    canvas.add(regrouped);
    if (zIndex >= 0) canvas.moveTo(regrouped, zIndex);
    canvas.setActiveObject(regrouped);
  } finally {
    if (canBatch) {
      canvas.historyProcessing = false;
      // The resize's object:modified already recorded the pre-resize state on
      // the undo stack; point the baseline at this normalised result so undo
      // lands on the original size and the next action records cleanly.
      canvas.historyNextState = canvas._historyNext();
    }
  }
  canvas.requestRenderAll();
  return true;
};
