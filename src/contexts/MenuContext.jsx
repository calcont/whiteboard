import React, { createContext, useState } from "react";
import { TOOL_CONSTANTS } from "../constants";

export const MenuContext = createContext({
  activeTool: null,
  setActiveTool: () => {},
  lockStatus: false,
  setLockStatus: () => {},
});

export const MenuProvider = ({ children }) => {
  const [activeTool, setActiveTool] = useState(TOOL_CONSTANTS.MARKER);
  const [lockStatus, setLockStatus] = useState(false);

  const context = {
    activeTool,
    setActiveTool,
    lockStatus,
    setLockStatus,
  };
  return (
    <MenuContext.Provider value={context}>{children}</MenuContext.Provider>
  );
};
