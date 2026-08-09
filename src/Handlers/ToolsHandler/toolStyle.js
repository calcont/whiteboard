// Shared drawing style for the shape tools. The properties panel keeps the
// current selection in MenuContext and mirrors the fabric-ready version onto
// canvas.currentStyle; the (non-React) tool classes read it here at create
// time so new shapes pick up the chosen stroke/fill/width/style.

export const DEFAULT_STYLE = {
  stroke: "#1e1e1e", // dark reads well on the white canvas
  strokeWidth: 3,
  strokeStyle: "solid", // solid | dashed | dotted
  fill: "transparent",
  fontFamily: "Arial",
  fontSize: 24,
};

export const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Comic Sans MS",
];

export const FONT_SIZES = [
  { label: "S", value: 16 },
  { label: "M", value: 24 },
  { label: "L", value: 36 },
];

export const STROKE_WIDTHS = [
  { label: "Thin", value: 2 },
  { label: "Medium", value: 4 },
  { label: "Bold", value: 8 },
];

export const STROKE_STYLES = ["solid", "dashed", "dotted"];

export const STROKE_SWATCHES = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#ae3ec9",
];

// "transparent" (no fill) plus a few soft fills.
export const FILL_SWATCHES = [
  "transparent",
  "#ffc9c9",
  "#b2f2bb",
  "#a5d8ff",
  "#ffec99",
  "#eebefa",
];

// Map the friendly stroke style to a fabric strokeDashArray, scaled by width.
export const strokeDashArrayFor = (strokeStyle, strokeWidth) => {
  if (strokeStyle === "dashed") return [strokeWidth * 4, strokeWidth * 3];
  if (strokeStyle === "dotted") return [strokeWidth, strokeWidth * 2];
  return null;
};

// Convert a style object into the fabric props shared by the shape tools.
// strokeUniform keeps the border a constant width when the shape is scaled
// (fabric otherwise scales strokeWidth, making borders balloon on resize).
export const toFabricStyle = (style = DEFAULT_STYLE) => ({
  stroke: style.stroke,
  strokeWidth: style.strokeWidth,
  strokeDashArray: strokeDashArrayFor(style.strokeStyle, style.strokeWidth),
  fill: style.fill,
  strokeUniform: true,
});

// Fabric-ready style the tools should apply to a new object.
export const resolveToolStyle = (canvas) =>
  canvas?.currentStyle || toFabricStyle(DEFAULT_STYLE);

// Fabric-ready props for a new text object (colour is the stroke swatch).
export const toTextStyle = (style = DEFAULT_STYLE) => ({
  fill: style.stroke,
  fontFamily: style.fontFamily,
  fontSize: style.fontSize,
});

// Text style the Font tool should apply to a new text object.
export const resolveTextStyle = (canvas) =>
  canvas?.currentTextStyle || toTextStyle(DEFAULT_STYLE);
