// Shared drawing style for the shape tools. The properties panel keeps the
// current selection in MenuContext and mirrors the fabric-ready version onto
// canvas.currentStyle; the (non-React) tool classes read it here at create
// time so new shapes pick up the chosen stroke/fill/width/style.

export const DEFAULT_STYLE = {
  stroke: "#ffffff", // white reads well on the dark canvas
  strokeWidth: 3,
  strokeStyle: "solid", // solid | dashed | dotted
  fill: "transparent",
};

export const STROKE_WIDTHS = [
  { label: "Thin", value: 2 },
  { label: "Medium", value: 4 },
  { label: "Bold", value: 8 },
];

export const STROKE_STYLES = ["solid", "dashed", "dotted"];

export const STROKE_SWATCHES = [
  "#ffffff",
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
];

// "transparent" (no fill) plus a few soft fills.
export const FILL_SWATCHES = [
  "transparent",
  "#ffffff",
  "#ffc9c9",
  "#b2f2bb",
  "#a5d8ff",
  "#ffec99",
];

// Map the friendly stroke style to a fabric strokeDashArray, scaled by width.
export const strokeDashArrayFor = (strokeStyle, strokeWidth) => {
  if (strokeStyle === "dashed") return [strokeWidth * 4, strokeWidth * 3];
  if (strokeStyle === "dotted") return [strokeWidth, strokeWidth * 2];
  return null;
};

// Convert a style object into the fabric props shared by the shape tools.
export const toFabricStyle = (style = DEFAULT_STYLE) => ({
  stroke: style.stroke,
  strokeWidth: style.strokeWidth,
  strokeDashArray: strokeDashArrayFor(style.strokeStyle, style.strokeWidth),
  fill: style.fill,
});

// Fabric-ready style the tools should apply to a new object.
export const resolveToolStyle = (canvas) =>
  canvas?.currentStyle || toFabricStyle(DEFAULT_STYLE);
