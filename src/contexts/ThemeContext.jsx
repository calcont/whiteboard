import React, { createContext, useEffect, useState } from "react";
import {
  THEME_LIGHT,
  THEME_DARK,
  getInitialTheme,
  applyTheme,
} from "../utils/theme";

export const ThemeContext = createContext({
  theme: THEME_LIGHT,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === THEME_DARK ? THEME_LIGHT : THEME_DARK));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
