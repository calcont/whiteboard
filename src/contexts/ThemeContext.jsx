import React, { createContext, useEffect, useState } from "react";
import {
  THEME_LIGHT,
  THEME_DARK,
  getInitialTheme,
  getStoredTheme,
  getSystemTheme,
  applyTheme,
  persistTheme,
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

  // Follow the OS colour scheme live — but only until the user makes a manual
  // choice (once they toggle, their stored pick wins and we stop following).
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
    } catch (e) {
      return undefined;
    }
    if (!mq) return undefined;
    const onChange = () => {
      if (!getStoredTheme()) setTheme(getSystemTheme());
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else if (mq.removeListener) mq.removeListener(onChange);
    };
  }, []);

  const toggleTheme = () =>
    setTheme((t) => {
      const next = t === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      persistTheme(next);
      return next;
    });

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
