import { fabric } from "fabric";

// Drop a lucide (or any) SVG string onto the canvas as a fabric group, sized and
// placed at the centre of the current viewport (pan/zoom aware), stroked in the
// given colour with no fill (outline icon), and selected so it can be moved/
// styled straight away.
const TARGET_SIZE = 56;

export const addIconToCanvas = (canvas, svgString, color = "#1e1e1e") => {
  if (!canvas || !svgString) return;
  fabric.loadSVGFromString(svgString, (objects, options) => {
    if (!objects || !objects.length) return;
    // lucide paths are stroke-only; force outline (no black default fill) and a
    // constant stroke width so scaling the icon doesn't thicken it.
    objects.forEach((o) =>
      o.set({ stroke: color, strokeUniform: true, fill: "" }),
    );
    const icon = fabric.util.groupSVGElements(objects, options);
    const scale =
      TARGET_SIZE /
      Math.max(icon.width || TARGET_SIZE, icon.height || TARGET_SIZE);
    icon.scale(scale);

    const vpt = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    const cx = (canvas.getWidth() / 2 - vpt[4]) / zoom;
    const cy = (canvas.getHeight() / 2 - vpt[5]) / zoom;
    // Cascade successive drops so stamping several icons doesn't pile them all
    // on the exact same spot.
    const offset = (canvas.getObjects().length % 6) * 16;
    icon.set({
      left: cx + offset,
      top: cy + offset,
      originX: "center",
      originY: "center",
      selectable: true,
    });
    icon.setCoords();
    canvas.add(icon);
    canvas.setActiveObject(icon);
    canvas.requestRenderAll();
  });
};
