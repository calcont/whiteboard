import { fabric } from "fabric";

// Drop an SVG string (a full-colour brand logo from the Iconify hub) onto the
// canvas as a fabric group — its original colours preserved — sized and placed
// at the centre of the current viewport (pan/zoom aware), and selected so it can
// be moved straight away.
const TARGET_SIZE = 64;

export const addSvgIconToCanvas = (canvas, svgString) => {
  if (!canvas || !svgString) return;
  fabric.loadSVGFromString(svgString, (objects, options) => {
    if (!objects || !objects.length) return;
    const icon = fabric.util.groupSVGElements(objects, options);
    const scale =
      TARGET_SIZE /
      Math.max(icon.width || TARGET_SIZE, icon.height || TARGET_SIZE);
    icon.scale(scale);

    const vpt = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    const cx = (canvas.getWidth() / 2 - vpt[4]) / zoom;
    const cy = (canvas.getHeight() / 2 - vpt[5]) / zoom;
    // Cascade successive drops so several logos don't pile on the same spot.
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
