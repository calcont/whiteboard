import { fabric } from "fabric";

// Live "this will bind" affordance: while an arrow is being drawn, the shape its
// endpoint is over gets a highlighted outline (like Excalidraw), so you can see
// the connection will be made before releasing. The highlight is a transient,
// non-interactive overlay — never selectable, never persisted (excludeFromExport)
// — kept on canvas.__bindHighlight and cleared on drop.

const HL_COLOR = "#4f46e5"; // indigo accent (matches the endpoint handles)
const PAD = 5;

export const showBindHighlight = (canvas, shape) => {
  if (!shape) return clearBindHighlight(canvas);
  const b = shape.getBoundingRect(true, true);
  const props = {
    left: b.left - PAD,
    top: b.top - PAD,
    width: b.width + PAD * 2,
    height: b.height + PAD * 2,
  };
  let hl = canvas.__bindHighlight;
  if (!hl) {
    hl = new fabric.Rect({
      ...props,
      rx: 16,
      ry: 16,
      fill: "transparent",
      stroke: HL_COLOR,
      strokeWidth: 3,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      __nonBindable: true,
      originX: "left",
      originY: "top",
    });
    canvas.__bindHighlight = hl;
    canvas.add(hl);
  } else {
    hl.set(props);
    if (canvas.getObjects().indexOf(hl) < 0) canvas.add(hl);
  }
  canvas.bringToFront(hl);
  hl.setCoords();
  canvas.requestRenderAll();
  return hl;
};

export const clearBindHighlight = (canvas) => {
  const hl = canvas && canvas.__bindHighlight;
  if (hl) {
    canvas.remove(hl);
    canvas.__bindHighlight = null;
    canvas.requestRenderAll();
  }
  return null;
};
