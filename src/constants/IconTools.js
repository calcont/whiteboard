import NearMeIcon from "@mui/icons-material/NearMe";
import BrushIcon from "@mui/icons-material/Brush";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import CircleIcon from "@mui/icons-material/Circle";
import DiamondIcon from "@mui/icons-material/Diamond";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ImageIcon from "@mui/icons-material/Image";
import PaletteIcon from "@mui/icons-material/Palette";
import AutoFixNormalIcon from "@mui/icons-material/AutoFixNormal";
import { TOOL_CONSTANTS } from "./tools";

export const iconToolsMaps = [
  { icon: NearMeIcon, title: "Select", id: TOOL_CONSTANTS.CURSOR },
  { icon: BrushIcon, title: "Marker", id: TOOL_CONSTANTS.MARKER },
  { icon: CropSquareIcon, title: "Rectangle", id: TOOL_CONSTANTS.RECTANGLE },
  { icon: CircleIcon, title: "Circle", id: TOOL_CONSTANTS.CIRCLE },
  { icon: DiamondIcon, title: "Diamond", id: TOOL_CONSTANTS.DIAMOND },
  { icon: HorizontalRuleIcon, title: "Line", id: TOOL_CONSTANTS.LINE },
  { icon: ArrowRightAltIcon, title: "Arrow", id: TOOL_CONSTANTS.ARROW },
  { icon: TextFieldsIcon, title: "Text", id: TOOL_CONSTANTS.FONT },
  { icon: ImageIcon, title: "Image", id: TOOL_CONSTANTS.IMAGE },
  {
    icon: PaletteIcon,
    title: "Background Color",
    id: TOOL_CONSTANTS.BACKGROUND_COLOR,
  },
  { icon: AutoFixNormalIcon, title: "Eraser", id: TOOL_CONSTANTS.ERASER },
];
