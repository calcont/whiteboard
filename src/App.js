import React from "react";
import './App.css';
import {CanvasEditor} from "./components/CanvasEditor";
import {CanvasProvider, MenuProvider} from "./contexts";

function App() {
    return (
        <CanvasProvider>
            <MenuProvider>
                <CanvasEditor/>
            </MenuProvider>
        </CanvasProvider>
    );
}

export default App;
