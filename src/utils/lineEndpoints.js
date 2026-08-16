import { fabric } from "fabric";

// Excalidraw-style endpoint handles for the Line tool: two draggable controls
// (p1, p2) at the line's ends, matching the arrow's (utils/arrowEndpoints). A
// bare fabric.Line is simpler than an arrow group — setting x1/y1 or x2/y2 and
// calling setCoords() moves that end and leaves the other put.

const IDENTITY = [1, 0, 0, 1, 0, 0];
const vptOf = (obj) => (obj.canvas ? obj.canvas.viewportTransform : IDENTITY);

// Absolute (screen) position of an endpoint, for drawing the handle.
const endpointAbs = (line, key) => {
  const lp = line.calcLinePoints();
  const local = key === "p1" ? { x: lp.x1, y: lp.y1 } : { x: lp.x2, y: lp.y2 };
  return fabric.util.transformPoint(
    new fabric.Point(local.x, local.y),
    fabric.util.multiplyTransformMatrices(
      vptOf(line),
      line.calcTransformMatrix(),
    ),
  );
};

// Move one endpoint to a SCENE-coordinate point.
export const setLineEndpoint = (line, key, scene) => {
  if (key === "p1") line.set({ x1: scene.x, y1: scene.y });
  else line.set({ x2: scene.x, y2: scene.y });
  line.setCoords();
};

const positionHandler = (key) =>
  function (dim, finalMatrix, line) {
    return endpointAbs(line, key);
  };

const actionHandler = (key) =>
  function (eventData, transform, x, y) {
    const line = transform.target;
    // control pointer is in screen coords -> map to scene (undo the viewport)
    const scene = fabric.util.transformPoint(
      new fabric.Point(x, y),
      fabric.util.invertTransform(vptOf(line)),
    );
    setLineEndpoint(line, key, scene);
    return true;
  };

const renderHandle = (ctx, left, top) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(left, top, 5, 0, 2 * Math.PI, false);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#4f46e5";
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

const makeControl = (key) =>
  new fabric.Control({
    positionHandler: positionHandler(key),
    actionHandler: actionHandler(key),
    actionName: "lineEndpoint",
    cursorStyle: "pointer",
    render: renderHandle,
  });

// Give a bare line the two endpoint handles instead of the bounding-box ones.
export const attachLineEndpointControls = (line) => {
  line.controls = { p1: makeControl("p1"), p2: makeControl("p2") };
  line.hasBorders = false;
};
