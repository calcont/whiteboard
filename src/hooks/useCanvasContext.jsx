import {useContext} from 'react';
import {CanvasContext} from '../contexts/';

export const useCanvasContext = () => {
    const {zoomRatio, setZoomRatio, setCanvas, canvas, activeObject, setActiveObject} = useContext(CanvasContext)
    return {
        zoomRatio,
        setZoomRatio,
        setCanvas,
        canvas,
        activeObject,
        setActiveObject,
    }
}

