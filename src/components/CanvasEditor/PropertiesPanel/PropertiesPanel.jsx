import React, { useEffect, useRef } from "react";
import { Tooltip } from "@mui/material";
import { useMenuContext, useCanvasContext } from "../../../hooks";
import { TOOL_CONSTANTS } from "../../../constants";
import {
  STROKE_SWATCHES,
  FILL_SWATCHES,
  STROKE_WIDTHS,
  STROKE_STYLES,
  toFabricStyle,
} from "../../../Handlers/ToolsHandler/toolStyle";
import "./PropertiesPanel.scss";

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
          : activeObject.fill,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        obj.set({ fill: nextStyle.stroke });
      } else if (obj.type === "group" && obj._objects) {
        // A group (e.g. the arrow) doesn't propagate style to its children,
        // so apply to each: line-like children take the stroke/width/dash;
        // the filled head takes the stroke colour as its fill.
        obj._objects.forEach((child) => {
          if (child.type === "line") {
            child.set({
              stroke: fab.stroke,
              strokeWidth: fab.strokeWidth,
              strokeDashArray: fab.strokeDashArray,
            });
          } else {
            child.set({ fill: fab.stroke });
          }
        });
        obj.dirty = true;
      } else {
        obj.set(fab);
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

  if (!activeObject && !STYLEABLE_TOOLS.has(activeTool)) return null;

  return (
    <div className="properties-panel upper">
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
                color === "transparent" ? undefined : { backgroundColor: color }
              }
              data-none={color === "transparent" ? "true" : undefined}
              onClick={() => updateStyle({ fill: color })}
              aria-label={color === "transparent" ? "No fill" : `Fill ${color}`}
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
    </div>
  );
};

export default PropertiesPanel;
