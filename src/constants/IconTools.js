import {
    faMarker,
    faSquare,
    faCircle,
    faArrowRight,
    faPalette,
    faFont,
    faImage,
    faArrowPointer,
    faDiamond,
    faEraser
} from '@fortawesome/free-solid-svg-icons';
import {TOOL_CONSTANTS} from "./tools";

export const iconToolsMaps = [
    {icon: faArrowPointer, title: "Select", id: TOOL_CONSTANTS.CURSOR},
    {icon: faMarker, title: "Marker", id: TOOL_CONSTANTS.MARKER},
    {icon: faSquare, title: "Rectangle", id: TOOL_CONSTANTS.RECTANGLE},
    {icon: faCircle, title: "Circle", id: TOOL_CONSTANTS.CIRCLE},
    {icon: faDiamond, title: "Diamond", id: TOOL_CONSTANTS.DIAMOND},
    {icon: faArrowRight, title: "Arrow", id: TOOL_CONSTANTS.ARROW},
    {icon: faFont, title: "Text", id: TOOL_CONSTANTS.FONT},
    {icon: faImage, title: "Image", id: TOOL_CONSTANTS.IMAGE},
    {icon: faPalette, title: "Background Color", id: TOOL_CONSTANTS.BACKGROUND_COLOR},
    {icon: faEraser, title: "Eraser", id: TOOL_CONSTANTS.ERASER},
];
