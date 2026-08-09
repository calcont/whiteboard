import React from "react";
import { Tooltip } from "@mui/material";
import { Sun, Moon } from "lucide-react";
import { useThemeContext, useMenuContext } from "../../../hooks";
import {
  THEME_DARK,
  THEME_LIGHT,
  LIGHT_INK,
  DARK_INK,
} from "../../../utils/theme";
import "./ThemeToggle.scss";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeContext();
  const { setStyle } = useMenuContext();
  const isDark = theme === THEME_DARK;

  const handleToggle = () => {
    const next = isDark ? THEME_LIGHT : THEME_DARK;
    // Swap the default ink so freshly drawn shapes stay visible on the new
    // board — but only when the user is still on the other theme's default (a
    // custom stroke is left untouched). The PropertiesPanel effect mirrors this
    // onto canvas.currentStyle, so the tools pick it up at draw time.
    setStyle((s) => {
      if (next === THEME_DARK && s.stroke === LIGHT_INK) {
        return { ...s, stroke: DARK_INK };
      }
      if (next === THEME_LIGHT && s.stroke === DARK_INK) {
        return { ...s, stroke: LIGHT_INK };
      }
      return s;
    });
    toggleTheme();
  };

  const Icon = isDark ? Sun : Moon;
  return (
    <div className="theme-toggle">
      <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
        <Icon
          className="theme-toggle__button"
          size={18}
          onClick={handleToggle}
        />
      </Tooltip>
    </div>
  );
};

export default ThemeToggle;
