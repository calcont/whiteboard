import { useContext } from "react";
import { ThemeContext } from "../contexts/";

export const useThemeContext = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return { theme, toggleTheme };
};
