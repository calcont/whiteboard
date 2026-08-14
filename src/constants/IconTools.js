import {
  MousePointer2,
  Brush,
  Square,
  Circle,
  Diamond,
  Hexagon,
  Minus,
  ArrowRight,
  Type,
  Image as ImageIcon,
  Palette,
  Eraser,
  Component,
} from "lucide-react";
import { TOOL_CONSTANTS } from "./tools";

export const iconToolsMaps = [
  { icon: MousePointer2, title: "Select", id: TOOL_CONSTANTS.CURSOR },
  { icon: Brush, title: "Marker", id: TOOL_CONSTANTS.MARKER },
  { icon: Square, title: "Rectangle", id: TOOL_CONSTANTS.RECTANGLE },
  { icon: Circle, title: "Circle", id: TOOL_CONSTANTS.CIRCLE },
  { icon: Diamond, title: "Diamond", id: TOOL_CONSTANTS.DIAMOND },
  { icon: Hexagon, title: "Polygon", id: TOOL_CONSTANTS.POLYGON },
  { icon: Minus, title: "Line", id: TOOL_CONSTANTS.LINE },
  { icon: ArrowRight, title: "Arrow", id: TOOL_CONSTANTS.ARROW },
  { icon: Type, title: "Text", id: TOOL_CONSTANTS.FONT },
  { icon: Component, title: "Icons (logos)", id: TOOL_CONSTANTS.ICONS },
  { icon: ImageIcon, title: "Image", id: TOOL_CONSTANTS.IMAGE },
  {
    icon: Palette,
    title: "Background Color",
    id: TOOL_CONSTANTS.BACKGROUND_COLOR,
  },
  { icon: Eraser, title: "Eraser", id: TOOL_CONSTANTS.ERASER },
];
