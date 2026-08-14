import React, { createContext, useState, useEffect } from "react";
import { TOOL_CONSTANTS } from "../constants";
import { DEFAULT_STYLE } from "../Handlers/ToolsHandler/toolStyle";
import { getStoredStyle, saveStyle } from "../utils/stylePrefs";

export const MenuContext = createContext({
  activeTool: null,
  setActiveTool: () => {},
  lockStatus: false,
  setLockStatus: () => {},
  style: DEFAULT_STYLE,
  setStyle: () => {},
});

export const MenuProvider = ({ children }) => {
  // Open (and re-open after a reload) in the selection tool, like excalidraw —
  // so you can immediately click/rubber-band select instead of landing in the
  // marker and drawing when you meant to select.
  const [activeTool, setActiveTool] = useState(TOOL_CONSTANTS.CURSOR);
  const [lockStatus, setLockStatus] = useState(false);
  // Start from the last-used style and persist it so a reload keeps the user's
  // last colour / width / fill / font / arrowhead choices.
  const [style, setStyle] = useState(getStoredStyle);

  useEffect(() => {
    saveStyle(style);
  }, [style]);

  const context = {
    activeTool,
    setActiveTool,
    lockStatus,
    setLockStatus,
    style,
    setStyle,
  };
  return (
    <MenuContext.Provider value={context}>{children}</MenuContext.Provider>
  );
};
