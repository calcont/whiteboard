import React, { createContext, useState } from "react";
import { TOOL_CONSTANTS } from "../constants";
import { DEFAULT_STYLE } from "../Handlers/ToolsHandler/toolStyle";

export const MenuContext = createContext({
  activeTool: null,
  setActiveTool: () => {},
  lockStatus: false,
  setLockStatus: () => {},
  style: DEFAULT_STYLE,
  setStyle: () => {},
});

export const MenuProvider = ({ children }) => {
  const [activeTool, setActiveTool] = useState(TOOL_CONSTANTS.MARKER);
  const [lockStatus, setLockStatus] = useState(false);
  const [style, setStyle] = useState(DEFAULT_STYLE);

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
