import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";
import { Tooltip } from "@mui/material";
import {
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";
import { useMenuContext, useCanvasContext } from "../../../hooks";
import { TOOL_CONSTANTS } from "../../../constants";
import {
  STROKE_SWATCHES,
  FILL_SWATCHES,
  STROKE_WIDTHS,
  STROKE_STYLES,
  FONT_FAMILIES,
  FONT_SIZES,
  ARROW_HEAD_OPTIONS,
  toFabricStyle,
  toTextStyle,
} from "../../../Handlers/ToolsHandler/toolStyle";
import { buildArrowGroup } from "../../../Handlers/ToolsHandler/tools/arrow";
import {
  isLabeledShape,
  getLabelParts,
  isArrow,
} from "../../../utils/shapeLabel";
import { dimColor, isDarkTheme } from "../../../utils/themeColor";
import "./PropertiesPanel.scss";

// In dark mode a shape's fill is stored dimmed; a chosen swatch is dimmed on
// the way onto the object, and un-dimmed on the way back into the panel (both
// via the self-inverse dimColor) so the panel always shows the authored colour.
const fillForObject = (fill) =>
  isDarkTheme() && fill && fill !== "transparent" ? dimColor(fill) : fill;

// Tools whose new shapes pick up the current style; the panel shows for these
// even with nothing selected, so a style can be chosen before drawing.
const STYLEABLE_TOOLS = new Set([
  TOOL_CONSTANTS.MARKER,
  TOOL_CONSTANTS.RECTANGLE,
  TOOL_CONSTANTS.CIRCLE,
  TOOL_CONSTANTS.DIAMOND,
  TOOL_CONSTANTS.POLYGON,
  TOOL_CONSTANTS.LINE,
  TOOL_CONSTANTS.ARROW,
  TOOL_CONSTANTS.FONT,
]);

const isText = (obj) =>
  obj &&
  (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox");

// Arrow detection is centralised in shapeLabel's isArrow (line + 1-2 heads,
// optional text label) — shared with the resize handler and label editor.
const isArrowObject = isArrow;

// An icon is an imported SVG logo — a group that isn't an arrow and isn't a
// labelled shape. Its colours come from the logo itself, so the
// stroke/fill/width/style controls must not touch it (that would flatten the
// logo into a single-colour blob).
const isIcon = (o) =>
  o && o.type === "group" && !isArrowObject(o) && !isLabeledShape(o);

// Best-effort reverse of strokeDashArray -> friendly style name.
const dashToStyle = (dash, width) => {
  if (!dash || !dash.length) return "solid";
  return dash[0] <= width ? "dotted" : "dashed";
};

const PropertiesPanel = () => {
  const { activeTool, style, setStyle } = useMenuContext();
  const { canvas, activeObject } = useCanvasContext();

  // Latest style, updated synchronously in updateStyle so several changes in a
  // row (or before a re-render) accumulate correctly instead of each merging
  // into a stale value.
  const styleRef = useRef(style);
  useEffect(() => {
    styleRef.current = style;
  }, [style]);

  // Mirror the chosen style onto the canvas so tools read it when creating,
  // and keep the free-draw brush colour in sync.
  useEffect(() => {
    if (!canvas) return;
    canvas.currentStyle = toFabricStyle(style);
    canvas.currentTextStyle = toTextStyle(style);
    // Arrowheads aren't a fabric prop — expose it separately for the arrow tool.
    canvas.currentArrowHeads = style.arrowHeads;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = style.stroke;
    }
  }, [canvas, style]);

  // When an object is selected, load its style into the panel. Groups (e.g.
  // arrows) and multi-selections are skipped so they don't clobber the chosen
  // defaults with a group's own (often empty) stroke/fill.
  useEffect(() => {
    if (!activeObject) return;
    const t = activeObject.type;
    // A labelled shape is a group; sync the panel to its text child's font so
    // the Size/Font controls reflect (and can change) the current label.
    if (isLabeledShape(activeObject)) {
      const { text: label } = getLabelParts(activeObject);
      if (label)
        setStyle((prev) => ({
          ...prev,
          fontFamily: label.fontFamily || prev.fontFamily,
          fontSize: label.fontSize || prev.fontSize,
        }));
      return;
    }
    if (t === "activeSelection" || t === "group") return;
    const text = isText(activeObject);
    setStyle((prev) => ({
      ...prev,
      // Text colour is stored in fill; map it onto the colour (stroke) control.
      stroke: text
        ? activeObject.fill || prev.stroke
        : activeObject.stroke || prev.stroke,
      strokeWidth: activeObject.strokeWidth || prev.strokeWidth,
      strokeStyle: dashToStyle(
        activeObject.strokeDashArray,
        activeObject.strokeWidth || prev.strokeWidth,
      ),
      fill: text
        ? prev.fill
        : activeObject.fill === "" || activeObject.fill == null
          ? "transparent"
          : fillForObject(activeObject.fill), // un-dim back to authored colour
      fontFamily: text
        ? activeObject.fontFamily || prev.fontFamily
        : prev.fontFamily,
      fontSize: text ? activeObject.fontSize || prev.fontSize : prev.fontSize,
    }));
  }, [activeObject]);

  const applyToActive = (nextStyle) => {
    if (!canvas || !activeObject) return;
    const fab = toFabricStyle(nextStyle);
    const targets =
      activeObject.type === "activeSelection"
        ? activeObject.getObjects()
        : [activeObject];
    targets.forEach((obj) => {
      // For text the colour control drives the text colour (fill); other
      // controls don't meaningfully apply.
      if (isText(obj)) {
        obj.set({
          fill: nextStyle.stroke,
          fontFamily: nextStyle.fontFamily,
          fontSize: nextStyle.fontSize,
        });
      } else if (isArrowObject(obj)) {
        // An arrow group doesn't propagate style to its children, so apply to
        // each: line-like children take the stroke/width/dash; the filled
        // head(s) take the stroke colour as their fill.
        obj._objects.forEach((child) => {
          if (child.type === "line") {
            child.set({
              stroke: fab.stroke,
              strokeWidth: fab.strokeWidth,
              strokeDashArray: fab.strokeDashArray,
            });
          } else if (child.type === "path") {
            child.set({ fill: fab.stroke });
          }
          // A text label child keeps its own colour (like shape labels).
        });
        obj.dirty = true;
      } else if (isLabeledShape(obj)) {
        // Labelled shape — style the box (shape child: fill/stroke/width/style)
        // AND the label (text child: font family/size) so the Size/Font controls
        // can change a label after it's created. The label keeps its own colour.
        const { shape, text } = getLabelParts(obj);
        if (shape) shape.set({ ...fab, fill: fillForObject(fab.fill) });
        if (text)
          text.set({
            fontFamily: nextStyle.fontFamily,
            fontSize: nextStyle.fontSize,
          });
        obj.dirty = true;
      } else if (obj.type === "group") {
        // Icon (imported SVG logo) — leave its own colours untouched.
      } else {
        // Plain shape — dim the fill in dark mode (fillForObject) so it matches
        // how DarkColorHandler stores fills.
        obj.set({ ...fab, fill: fillForObject(fab.fill) });
      }
    });
    canvas.requestRenderAll();
    // Record a single history entry for the style change.
    canvas.fire("object:modified", { target: activeObject });
  };

  const updateStyle = (patch) => {
    const next = { ...styleRef.current, ...patch };
    styleRef.current = next;
    setStyle(next);
    applyToActive(next);
  };

  // Arrowheads can't be set with obj.set() — the head is a child object — so a
  // selected arrow is rebuilt with the new config. Also updates the default for
  // the next drawn arrow.
  const setArrowHeads = (mode) => {
    const next = { ...styleRef.current, arrowHeads: mode };
    styleRef.current = next;
    setStyle(next);
    if (!canvas || !isArrowObject(activeObject)) return;

    const group = activeObject;
    const line = group._objects.find((c) => c.type === "line");
    const textChild = group._objects.find((c) => isText(c));
    const matrix = group.calcTransformMatrix();
    const lp = line.calcLinePoints();
    const p1 = fabric.util.transformPoint(
      new fabric.Point(line.left + lp.x1, line.top + lp.y1),
      matrix,
    );
    const p2 = fabric.util.transformPoint(
      new fabric.Point(line.left + lp.x2, line.top + lp.y2),
      matrix,
    );
    const arrow = buildArrowGroup(
      { x: p1.x, y: p1.y },
      { x: p2.x, y: p2.y },
      {
        stroke: line.stroke,
        strokeWidth: line.strokeWidth,
        strokeDashArray: line.strokeDashArray,
        heads: mode,
        // Preserve a label when toggling the head style.
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

    const supportsHistory = typeof canvas._historySaveAction === "function";
    if (supportsHistory) canvas.historyProcessing = true;
    canvas.remove(group);
    canvas.add(arrow);
    arrow.setCoords();
    canvas.setActiveObject(arrow);
    if (supportsHistory) canvas.historyProcessing = false;
    canvas.requestRenderAll();
    // One history entry (and a persistence save) for the head change.
    canvas.fire("object:modified", { target: arrow });
  };

  // Reorder the selection's z-index. sendToBack/sendBackwards process in
  // reverse so a multi-selection keeps its internal stacking order.
  const reorder = (method) => {
    if (!canvas || !activeObject) return;
    const targets =
      activeObject.type === "activeSelection"
        ? activeObject.getObjects()
        : [activeObject];
    const ordered =
      method === "sendToBack" || method === "sendBackwards"
        ? [...targets].reverse()
        : targets;
    // The one-step actions move relative to *overlapping* objects only
    // (fabric's `intersecting` flag), so nudging a shape that's already in
    // front of everything it touches is a no-op instead of endlessly walking
    // it up the flat stack. The "all the way" actions ignore this.
    const oneStep = method === "bringForward" || method === "sendBackwards";
    ordered.forEach((obj) => canvas[method](obj, oneStep));
    canvas.requestRenderAll();
    // Record one history entry (and trigger persistence) for the reorder.
    canvas.fire("object:modified", { target: activeObject });
  };

  if (!activeObject && !STYLEABLE_TOOLS.has(activeTool)) return null;

  // Text context shows ONLY font controls; shapes show fill/width/style. A
  // labelled shape shows BOTH — box styling and the label's font/size — so the
  // Size/Font controls can change a label after it's been created.
  const textContext =
    isText(activeObject) || activeTool === TOOL_CONSTANTS.FONT;
  const labeledContext = isLabeledShape(activeObject);
  const showFont = textContext || labeledContext;

  // Arrow context adds the arrowheads control. When an arrow is selected, the
  // active option reflects that arrow's own head count; otherwise the default.
  const selectedArrowHeads = isArrowObject(activeObject)
    ? activeObject._objects.filter((c) => c.type === "path").length === 2
      ? "both"
      : "end"
    : null;
  const arrowContext =
    activeTool === TOOL_CONSTANTS.ARROW || selectedArrowHeads !== null;
  const activeHeads = selectedArrowHeads || style.arrowHeads;

  // An icon (imported logo) has no editable colour/width/style — it keeps its
  // own artwork — so the panel shows only its position/layer controls.
  const iconContext = isIcon(activeObject);

  return (
    <div className="properties-panel upper">
      {iconContext && (
        <div className="properties-panel__group">
          <span className="properties-panel__label">Icon</span>
          <span className="properties-panel__hint">
            Keeps its own colours — move, resize, layer or delete it.
          </span>
        </div>
      )}
      {!iconContext && (
        <div className="properties-panel__group">
          <span className="properties-panel__label">Stroke</span>
          <div className="properties-panel__swatches">
            {STROKE_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                className={
                  style.stroke === color
                    ? "properties-panel__swatch active"
                    : "properties-panel__swatch"
                }
                style={{ backgroundColor: color }}
                onClick={() => updateStyle({ stroke: color })}
                aria-label={`Stroke ${color}`}
              />
            ))}
            <Tooltip title="Custom stroke color">
              <input
                type="color"
                className="properties-panel__picker"
                value={style.stroke}
                onChange={(e) => updateStyle({ stroke: e.target.value })}
              />
            </Tooltip>
          </div>
        </div>
      )}

      {!iconContext && showFont && (
        <>
          <div className="properties-panel__group">
            <span className="properties-panel__label">Font</span>
            <select
              className="properties-panel__select"
              value={style.fontFamily}
              style={{ fontFamily: style.fontFamily }}
              onChange={(e) => updateStyle({ fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="properties-panel__group">
            <span className="properties-panel__label">Size</span>
            <div className="properties-panel__row">
              {FONT_SIZES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={
                    style.fontSize === s.value
                      ? "properties-panel__btn active"
                      : "properties-panel__btn"
                  }
                  onClick={() => updateStyle({ fontSize: s.value })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!iconContext && !textContext && (
        <>
          <div className="properties-panel__group">
            <span className="properties-panel__label">Fill</span>
            <div className="properties-panel__swatches">
              {FILL_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={
                    style.fill === color
                      ? "properties-panel__swatch active"
                      : "properties-panel__swatch"
                  }
                  style={
                    color === "transparent"
                      ? undefined
                      : { backgroundColor: color }
                  }
                  data-none={color === "transparent" ? "true" : undefined}
                  onClick={() => updateStyle({ fill: color })}
                  aria-label={
                    color === "transparent" ? "No fill" : `Fill ${color}`
                  }
                />
              ))}
              <Tooltip title="Custom fill color">
                <input
                  type="color"
                  className="properties-panel__picker"
                  value={style.fill === "transparent" ? "#ffffff" : style.fill}
                  onChange={(e) => updateStyle({ fill: e.target.value })}
                />
              </Tooltip>
            </div>
          </div>

          <div className="properties-panel__group">
            <span className="properties-panel__label">Width</span>
            <div className="properties-panel__row">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  className={
                    style.strokeWidth === w.value
                      ? "properties-panel__btn active"
                      : "properties-panel__btn"
                  }
                  onClick={() => updateStyle({ strokeWidth: w.value })}
                >
                  <span
                    className="properties-panel__width-preview"
                    style={{ height: `${w.value}px` }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="properties-panel__group">
            <span className="properties-panel__label">Style</span>
            <div className="properties-panel__row">
              {STROKE_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={
                    style.strokeStyle === s
                      ? "properties-panel__btn active"
                      : "properties-panel__btn"
                  }
                  onClick={() => updateStyle({ strokeStyle: s })}
                >
                  <span
                    className="properties-panel__style-preview"
                    style={{
                      borderTopStyle:
                        s === "solid"
                          ? "solid"
                          : s === "dashed"
                            ? "dashed"
                            : "dotted",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {arrowContext && (
        <div className="properties-panel__group">
          <span className="properties-panel__label">Arrowheads</span>
          <div className="properties-panel__row">
            {ARROW_HEAD_OPTIONS.map((opt) => (
              <Tooltip title={opt.label} key={opt.id}>
                <button
                  type="button"
                  className={
                    activeHeads === opt.id
                      ? "properties-panel__btn active"
                      : "properties-panel__btn"
                  }
                  onClick={() => setArrowHeads(opt.id)}
                  aria-label={opt.label}
                >
                  {opt.id === "both" ? (
                    <ArrowLeftRight size={16} />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {activeObject && (
        <div className="properties-panel__group">
          <span className="properties-panel__label">Layer</span>
          <div className="properties-panel__row">
            <Tooltip title="Send to back (all the way)">
              <button
                type="button"
                className="properties-panel__btn"
                onClick={() => reorder("sendToBack")}
              >
                <ChevronsDown size={16} />
              </button>
            </Tooltip>
            <Tooltip title="Send backward (one step)">
              <button
                type="button"
                className="properties-panel__btn"
                onClick={() => reorder("sendBackwards")}
              >
                <ChevronDown size={16} />
              </button>
            </Tooltip>
            <Tooltip title="Bring forward (one step)">
              <button
                type="button"
                className="properties-panel__btn"
                onClick={() => reorder("bringForward")}
              >
                <ChevronUp size={16} />
              </button>
            </Tooltip>
            <Tooltip title="Bring to front (all the way)">
              <button
                type="button"
                className="properties-panel__btn"
                onClick={() => reorder("bringToFront")}
              >
                <ChevronsUp size={16} />
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
