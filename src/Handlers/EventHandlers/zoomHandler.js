import {useCanvasContext} from "../../hooks";
import {useEffect,useCallback} from "react";
import {fabric} from "fabric";

function ZoomHandler() {
    const { canvas, zoomRatio } = useCanvasContext()

    const updateZoom = useCallback(
        (zoomRatio) => {
            if (canvas) {
                canvas.zoomToPoint(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), zoomRatio)
            }
        },
        [canvas]
    )

    useEffect(() => {
        updateZoom(zoomRatio)
    }, [zoomRatio])
}

export default ZoomHandler