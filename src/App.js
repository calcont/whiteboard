import React from "react";
import {CanvasEditor} from "./components/CanvasEditor";
import {StyledEngineProvider} from '@mui/material/styles';
import {CanvasProvider, MenuProvider} from "./contexts";
import './App.css';

function App() {
    return (
        <StyledEngineProvider injectFirst>
            <CanvasProvider>
                <MenuProvider>
                    <CanvasEditor/>
                </MenuProvider>
            </CanvasProvider>
        </StyledEngineProvider>
    );
}

export default App;
