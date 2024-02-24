import React, { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Grid from "@mui/material/Grid";
import Fade from "@mui/material/Fade";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
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
  const [isCustomDialogOpen, setCustomDialogOpen] = useState(false);
  const [cAnchorEl, cSetAnchorEl] = React.useState(null);

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

  const handleCustomDialogOpen = (e) => {
    setSelectedIndex(-1);
    cSetAnchorEl(e.currentTarget);
    setCustomDialogOpen(true);
  };

  const handleCustomDialogClose = () => {
    cSetAnchorEl(null);
    setCustomDialogOpen(false);
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
          <Tooltip title={"Set custom color"}>
            <MenuItem
              onClick={handleCustomDialogOpen}
              selected={selectedIndex === -1}
            >
              <div style={generateColorBoxStyle(customColor)} />
            </MenuItem>
          </Tooltip>
        </Grid>
      </Menu>
      <CustomColorInput
        anchor={cAnchorEl}
        open={isCustomDialogOpen}
        onClose={handleCustomDialogClose}
        customColor={customColor}
        setCustomColor={handleColorSelect}
      />
    </>
  );
};

function CustomColorInput({
  anchor,
  open,
  onClose,
  customColor,
  setCustomColor,
}) {
  return (
    <div>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <div style={{ padding: "16px", maxWidth: "200px" }}>
          <TextField
            id="outlined-basic"
            label="Enter Hex Color Code"
            variant="outlined"
            defaultValue={customColor}
            onChange={(e) => setCustomColor(e.target.value, -1)}
          />
        </div>
      </Popover>
    </div>
  );
}

export default BackgroundColor;
