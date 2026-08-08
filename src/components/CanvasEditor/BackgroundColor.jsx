import React, { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Grid from "@mui/material/Grid";
import Fade from "@mui/material/Fade";
import Divider from "@mui/material/Divider";
import { useCanvasContext } from "../../hooks";
import { Tooltip } from "@mui/material";

const colorOptions = [
  { name: "White", color: "#ffffff" },
  { name: "Blue", color: "#f5faff" },
  { name: "Grey", color: "#fdf8f6" },
];

const generateColorBoxStyle = (color) => ({
  width: "20px",
  height: "20px",
  borderRadius: "10%",
  backgroundColor: color,
  border: "0.1px solid #000",
});

const hexReg = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;

const BackgroundColor = ({ open, anchorEl, onClose }) => {
  const { canvas } = useCanvasContext();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [customColor, setCustomColor] = useState("#ffffff");

  const handleClose = () => {
    onClose();
  };

  const handleColorSelect = (color, index) => {
    if (!hexReg.test(color)) {
      return;
    }
    if (index === -1) {
      setCustomColor(color);
    } else {
      setSelectedIndex(index);
      handleClose();
    }
    document.getElementsByTagName("body")[0].style.backgroundColor = color;
    canvas.backgroundColor = color;
    canvas.renderAll();
  };

  return (
    <>
      <Menu
        id="color-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        MenuListProps={{
          "aria-labelledby": "color-button",
          orientation: "horizontal",
        }}
      >
        <Grid container>
          {colorOptions.map((option, index) => (
            <Grid item key={option.color}>
              <Tooltip title={option.color}>
                <MenuItem
                  onClick={() => handleColorSelect(option.color, index)}
                  selected={selectedIndex === index}
                >
                  <div style={generateColorBoxStyle(option.color)} />
                </MenuItem>
              </Tooltip>
            </Grid>
          ))}
          <Divider orientation="vertical" flexItem />
          <Tooltip title={"Pick a color"}>
            <MenuItem selected={selectedIndex === -1} disableRipple>
              <input
                type="color"
                aria-label="Background color picker"
                value={hexReg.test(customColor) ? customColor : "#ffffff"}
                onChange={(e) => handleColorSelect(e.target.value, -1)}
                style={{
                  width: "24px",
                  height: "24px",
                  padding: 0,
                  border: "0.1px solid #000",
                  borderRadius: "10%",
                  background: "none",
                  cursor: "pointer",
                }}
              />
            </MenuItem>
          </Tooltip>
        </Grid>
      </Menu>
    </>
  );
};

export default BackgroundColor;
