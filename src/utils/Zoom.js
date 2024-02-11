export const handleZoomUtil = (sign, canvas) => {
  if (canvas) {
    let zoom = canvas.getZoom();
    zoom += 0.25 * sign;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    return zoom;
  }
};
