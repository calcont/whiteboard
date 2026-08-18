import { fabric } from "fabric";
import { Tool } from "../toolGeneric";
import { resolveToolStyle } from "../toolStyle";
import {
  attachEndpointControls,
  elbowRoute,
  setArrowEndpoints,
  sceneEndpoints,
  headCenterFor,
} from "../../../utils/arrowEndpoints";
import { getArrowParts, isElbowArrow } from "../../../utils/shapeLabel";
import { bindArrowOnDraw, shapeUnderPoint } from "../../../utils/binding";
import {
  showBindHighlight,
  clearBindHighlight,
} from "../../../utils/bindingHighlight";

const ARROW_HEAD_PATH = "M 0 0 L 20 10 L 0 20 Z";

const angleBetween = (start, end) =>
  (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;

// A fixed-size arrowhead (filled triangle) centred at `at`, pointing along
// `angle`. Kept a plain child so the head config can be derived from the number
// of path children (1 = single, 2 = double) — no custom props to persist.
const makeHead = (at, angle, color) =>
  new fabric.Path(ARROW_HEAD_PATH, {
    stroke: "",
    strokeWidth: 0,
    fill: color,
    originX: "center",
    originY: "center",
    left: at.x,
    top: at.y,
    angle,
    hasControls: false,
    hasBorders: false,
    selectable: false,
  });

// Build a fresh arrow (line + fixed-size head(s)) from start -> end with the
// given style. style.heads: "end" (default, single head at end) or "both"
// (a second head at start). Exported so the resize handler and the properties
// panel can rebuild an arrow without scaling — and distorting — the head(s).
export const buildArrowGroup = (start, end, style) => {
  const elbow = style.arrowType === "elbow";
  const connStyle = {
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    strokeDashArray: style.strokeDashArray || null,
    strokeUniform: true,
    originX: "center",
    originY: "center",
    hasControls: false,
    hasBorders: false,
    selectable: false,
  };
  // The connector: a straight line, or an orthogonally-routed polyline (elbow).
  const line = elbow
    ? new fabric.Polyline(elbowRoute(start, end), { ...connStyle, fill: "" })
    : new fabric.Line([start.x, start.y, end.x, end.y], connStyle);
  // Head aims along the last route segment (= start->end for a straight arrow).
  // Its centre is backed off so the tip vertex sits exactly on the endpoint.
  const route = elbow ? elbowRoute(start, end) : [start, end];
  const prev = route[route.length - 2];
  const children = [
    line,
    makeHead(headCenterFor(end, prev), angleBetween(prev, end), style.stroke),
  ];
  if (style.heads === "both") {
    children.push(
      makeHead(
        headCenterFor(start, route[1]),
        angleBetween(route[1], start),
        style.stroke,
      ),
    );
  }
  // Optional centred text label, anchored to the line's midpoint. Carried
  // through rebuilds (resize) so a labelled arrow keeps its label; a non-
  // interactive child like the head(s), so the arrow group stays the unit.
  if (style.label && style.label.text) {
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    // Only set provided text props — passing an undefined fontFamily makes
    // fabric's font-cache crash on .toLowerCase(); omitting it keeps fabric's
    // own default instead.
    const labelOpts = {
      left: mid.x,
      top: mid.y,
      originX: "center",
      originY: "center",
      textAlign: "center",
      hasControls: false,
      hasBorders: false,
      selectable: false,
    };
    if (style.label.fontFamily) labelOpts.fontFamily = style.label.fontFamily;
    if (style.label.fontSize) labelOpts.fontSize = style.label.fontSize;
    if (style.label.fill) labelOpts.fill = style.label.fill;
    // Background masks the line behind the label so it isn't struck through.
    if (style.label.backgroundColor)
      labelOpts.backgroundColor = style.label.backgroundColor;
    // IText (not Textbox): the label auto-sizes to its content on the line
    // instead of wrapping inside a fixed narrow box.
    children.push(new fabric.IText(style.label.text, labelOpts));
  }
  const group = new fabric.Group(children, {
    objectCaching: false,
    // Select an arrow by its actual line/head pixels, not its (large) bounding
    // box — so two overlapping arrows can each be picked by clicking the one you
    // mean instead of always grabbing the top box. Per-object, so filled/
    // transparent shapes keep convenient click-anywhere bbox selection.
    perPixelTargetFind: true,
  });
  // Re-lay the connector in group-local space (and re-fit bounds) through the
  // single layout path, so its points/endpoints are consistent with the rest of
  // the arrow model — an elbow polyline needs it (built in absolute coords), and
  // a straight line needs the head-tip shortening applyEndpointsLocal applies.
  setArrowEndpoints(group, { x: start.x, y: start.y }, { x: end.x, y: end.y });
  // Excalidraw-style editing: drag either endpoint to re-aim/extend the arrow,
  // instead of scaling a bounding box. Replaces the default controls with two
  // endpoint handles (tail + tip).
  attachEndpointControls(group);
  return group;
};

// Binding fields carried across a rebuild so a rebuilt arrow stays bound.
const BINDING_FIELDS = [
  "id",
  "startBinding",
  "endBinding",
  "startAnchor",
  "endAnchor",
];

// Rebuild an existing arrow between its current endpoints, preserving its style,
// heads, elbow/straight type, label and bindings — with `overrides` applied
// (e.g. { arrowType: "elbow" } or { heads: "both" }). The single rebuild path
// for the properties panel and the resize handler, so all of them handle elbow
// arrows and keep bindings. Does NOT touch the canvas — the caller swaps it in.
export const rebuildArrow = (group, overrides = {}) => {
  const { tail, tip } = sceneEndpoints(group);
  const { line, heads, text } = getArrowParts(group);
  const arrow = buildArrowGroup(tail, tip, {
    stroke: line.stroke,
    strokeWidth: line.strokeWidth,
    strokeDashArray: line.strokeDashArray,
    heads: heads.length === 2 ? "both" : "end",
    arrowType: isElbowArrow(group) ? "elbow" : "straight",
    label: text
      ? {
          text: text.text,
          fontFamily: text.fontFamily,
          fontSize: text.fontSize,
          fill: text.fill,
          backgroundColor: text.backgroundColor,
        }
      : null,
    ...overrides,
  });
  BINDING_FIELDS.forEach((f) => {
    if (group[f] !== undefined) arrow[f] = group[f];
  });
  arrow.setCoords();
  return arrow;
};

export class Arrow extends Tool {
  constructor() {
    super();
    this.origX = null;
    this.origY = null;
    this.pointer = null;
    this.line = null;
    this.arrowHead = null;
    this.arrowHeadStart = null;
    this.style = null;
    this.heads = "end";
    this.deleteOffset = 10;
  }

  create(canvas, event) {
    this.pointer = canvas.getPointer(event.e);
    this.origX = this.pointer.x;
    this.origY = this.pointer.y;
    this.style = resolveToolStyle(canvas);
    this.heads = canvas.currentArrowHeads === "both" ? "both" : "end";
    this.arrowType = canvas.currentArrowType === "elbow" ? "elbow" : "straight";

    // Live preview: a plain line + head that follow the cursor; on mouse-up
    // they're replaced by a proper arrow group (buildArrowGroup).
    this.line = new fabric.Line(
      [this.origX, this.origY, this.origX, this.origY],
      {
        stroke: this.style.stroke,
        strokeWidth: this.style.strokeWidth,
        strokeDashArray: this.style.strokeDashArray,
        originX: "center",
        originY: "center",
        hasControls: false,
        hasBorders: false,
        selectable: false,
      },
    );
    this.arrowHead = makeHead(
      { x: this.origX, y: this.origY },
      0,
      this.style.stroke,
    );
    canvas.add(this.line, this.arrowHead);
    // Preview the second head too when drawing a double-headed arrow.
    if (this.heads === "both") {
      this.arrowHeadStart = makeHead(
        { x: this.origX, y: this.origY },
        0,
        this.style.stroke,
      );
      canvas.add(this.arrowHeadStart);
    }
  }

  draw(canvas, event) {
    if (!this.line) {
      return;
    }
    this.pointer = canvas.getPointer(event.e);
    const origin = { x: this.origX, y: this.origY };
    // Back the head off so its tip (not centre) tracks the cursor, and stop the
    // line at the head centre so it's hidden under the head (not poking past the
    // tip) — matching the final arrow, so the preview doesn't shift on drop.
    const headCen = headCenterFor(this.pointer, origin);
    const startCen = this.arrowHeadStart
      ? headCenterFor(origin, this.pointer)
      : origin;
    this.line.set({
      x1: startCen.x,
      y1: startCen.y,
      x2: headCen.x,
      y2: headCen.y,
    });
    this.line.setCoords();
    this.arrowHead.left = headCen.x;
    this.arrowHead.top = headCen.y;
    this.arrowHead.angle = angleBetween(origin, this.pointer);
    this.arrowHead.setCoords();
    if (this.arrowHeadStart) {
      this.arrowHeadStart.left = startCen.x;
      this.arrowHeadStart.top = startCen.y;
      this.arrowHeadStart.angle = angleBetween(this.pointer, origin);
      this.arrowHeadStart.setCoords();
    }
    // Live binding affordance: highlight BOTH the source (start) shape and the
    // shape the moving endpoint is over, excluding the transient preview objects.
    const preview = [this.line, this.arrowHead, this.arrowHeadStart];
    const src = shapeUnderPoint(
      canvas,
      { x: this.origX, y: this.origY },
      preview,
    );
    const dst = shapeUnderPoint(canvas, this.pointer, preview);
    showBindHighlight(canvas, [src, dst]);
  }

  done(canvas) {
    clearBindHighlight(canvas);
    // Use the arrow's actual length, not just its horizontal extent — a
    // vertical/steep arrow has a small x-delta and was being discarded as if
    // it were a stray click, so it never appeared.
    const length = Math.hypot(
      this.pointer.x - this.origX,
      this.pointer.y - this.origY,
    );
    canvas.remove(this.line, this.arrowHead);
    if (this.arrowHeadStart) canvas.remove(this.arrowHeadStart);
    if (length < this.deleteOffset) {
      return;
    }
    const arrow = buildArrowGroup(
      { x: this.origX, y: this.origY },
      { x: this.pointer.x, y: this.pointer.y },
      {
        ...(this.style || resolveToolStyle(canvas)),
        heads: this.heads,
        arrowType: this.arrowType,
      },
    );
    arrow.setCoords();
    canvas.add(arrow);
    // Bind either end that was dropped on a shape, and snap it to the border so
    // the arrow stays glued when that shape later moves (eraser.io style).
    bindArrowOnDraw(
      canvas,
      arrow,
      { x: this.origX, y: this.origY },
      { x: this.pointer.x, y: this.pointer.y },
    );
  }
}
