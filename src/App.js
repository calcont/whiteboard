import React, { useMemo } from "react";
import { CanvasEditor } from "./components/CanvasEditor";
import {
  StyledEngineProvider,
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { CanvasProvider, MenuProvider, ThemeProvider } from "./contexts";
import { useThemeContext } from "./hooks";
import { getInitialTheme, applyTheme } from "./utils/theme";
import "./App.css";

// Set the theme attribute before first paint so the board/chrome don't flash
// the light theme on load for a dark-mode user.
applyTheme(getInitialTheme());

// Bridge our theme into MUI so its portalled bits (Dialog, Menu, Tooltip,
// Divider) match the light/dark chrome instead of staying stuck on light.
const ThemedApp = () => {
  const { theme } = useThemeContext();
  const muiTheme = useMemo(
    () => createTheme({ palette: { mode: theme } }),
    [theme],
  );
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CanvasProvider>
        <MenuProvider>
          <CanvasEditor />
        </MenuProvider>
      </CanvasProvider>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
