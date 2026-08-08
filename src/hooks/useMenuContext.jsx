import { useContext } from "react";
import { MenuContext } from "../contexts/";
export const useMenuContext = () => {
  const {
    activeTool,
    setActiveTool,
    lockStatus,
    setLockStatus,
    style,
    setStyle,
  } = useContext(MenuContext);
  return {
    activeTool,
    setActiveTool,
    lockStatus,
    setLockStatus,
    style,
    setStyle,
  };
};
