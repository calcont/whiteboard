import React from "react";
import Menu from "@mui/material/Menu";
import { Tooltip } from "@mui/material";
import { INFRA_ICONS } from "../../../constants/InfraIcons";
import { useCanvasContext } from "../../../hooks";
import { addIconToCanvas } from "../../../utils/iconToCanvas";
import "./IconLibrary.scss";

// A picker of infra/architecture icons. Clicking one grabs its rendered SVG
// markup and drops it onto the canvas as a movable/stylable object.
const IconLibrary = ({ open, anchorEl, onClose }) => {
  const { canvas } = useCanvasContext();

  // Add the icon but keep the picker open so several can be stamped in a row;
  // the user closes it by clicking away or pressing Escape.
  const handlePick = (e) => {
    const svg = e.currentTarget.querySelector("svg");
    if (svg && canvas) {
      const color =
        (canvas.currentStyle && canvas.currentStyle.stroke) || "#1e1e1e";
      addIconToCanvas(canvas, svg.outerHTML, color);
    }
  };

  return (
    <Menu
      id="icon-library-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <div className="icon-library">
        {INFRA_ICONS.map(({ name, Icon }) => (
          <Tooltip title={name} key={name}>
            <button
              type="button"
              className="icon-library__item"
              onClick={handlePick}
              aria-label={name}
            >
              <Icon size={24} />
            </button>
          </Tooltip>
        ))}
      </div>
    </Menu>
  );
};

export default IconLibrary;
