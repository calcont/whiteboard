import {useCanvasContext} from "../../hooks";
import {useEffect, useCallback} from "react";
import {fabric} from "fabric";
import {isCtrlShiftZ, isArrow, isCtrlA, isCtrlD, isCtrlZ, isCtrlMinus, isCtrlPlus} from "../../utils/Shortcuts";
import {handleZoomUtil} from "../../utils/Zoom";

function KeyBoardHandler() {
    const {canvas, activeObject, setZoomRatio} = useCanvasContext();

    const handleDeleteSelected = () => {
        if (activeObject) {
            if (activeObject._objects) {
                activeObject._objects.forEach((obj) => {
                    canvas.discardActiveObject();
                    canvas.remove(obj);
                });
            }
            canvas.discardActiveObject();
            canvas.remove(activeObject);
            // sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
            canvas.requestRenderAll();
        }
    };

    // reference :- http://fabricjs.com/copypaste
    const duplicateObjects = () => {
        if (activeObject) {
            activeObject.clone((clonedObj) => {
                canvas.discardActiveObject();
                clonedObj.set({
                    left: clonedObj.left + 20,
                    top: clonedObj.top + 20,
                });
                if (clonedObj.type === 'activeSelection') {
                    // active selection needs a reference to the canvas.
                    clonedObj.canvas = canvas;
                    clonedObj.forEachObject(function (obj) {
                        canvas.add(obj);
                    });
                    // this should solve the unselectability
                    clonedObj.setCoords();
                } else {
                    canvas.add(clonedObj);
                }
                canvas.setActiveObject(clonedObj);
                canvas.renderAll();
            })
        }
    }

    const selectAllObjects = () => {
        const objects = canvas.getObjects();
        if (objects) {
            canvas.discardActiveObject();
            const activeSelection = new fabric.ActiveSelection(objects, {
                canvas: canvas,
            });
            canvas.setActiveObject(activeSelection);
            canvas.requestRenderAll();
        }
    }
    const undo = useCallback(() => {
        canvas?.undo()
    }, [canvas])

    const redo = useCallback(() => {
        canvas?.redo()
    }, [canvas])

    const moveUp = useCallback(() => {
        if (activeObject && canvas) {
            activeObject.top = activeObject.top - 2
            activeObject.setCoords()
            canvas.requestRenderAll()
        }
    }, [activeObject, canvas])

    const moveDown = useCallback(() => {
        if (activeObject && canvas) {
            activeObject.top = activeObject.top + 2
            activeObject.setCoords()
            canvas.requestRenderAll()
        }
    }, [activeObject, canvas])

    const moveRight = useCallback(() => {
        if (activeObject && canvas) {
            activeObject.left = activeObject.left + 2
            activeObject.setCoords()
            canvas.requestRenderAll()
        }
    }, [activeObject, canvas])

    const moveLeft = useCallback(() => {
        if (activeObject && canvas) {
            activeObject.left = activeObject.left - 2
            activeObject.setCoords()
            canvas.requestRenderAll()
        }
    }, [activeObject, canvas])

    useEffect(() => {
        const keyManager = (e) => {
            switch (true) {
                case e.keyCode === 46: // delete selected objects
                    handleDeleteSelected(canvas);
                    break;
                case isCtrlD(e): // duplicate selected objects
                    e.preventDefault();
                    duplicateObjects(canvas);
                    break;
                case isCtrlA(e): // select all objects
                    e.preventDefault();
                    selectAllObjects(canvas);
                    break;
                case isCtrlZ(e): // undo
                    undo();
                    e.preventDefault();
                    break;
                case isCtrlShiftZ(e): // redo
                    redo();
                    e.preventDefault();
                    break;
                case isCtrlPlus(e): // zoom in
                    setZoomRatio(handleZoomUtil(1, canvas));
                    e.preventDefault();
                    break;
                case isCtrlMinus(e): // zoom out
                    setZoomRatio(handleZoomUtil(-1, canvas));
                    e.preventDefault();
                    break;
                case isArrow(e):
                    e.code === 'ArrowLeft' && moveLeft()
                    e.code === 'ArrowRight' && moveRight()
                    e.code === 'ArrowDown' && moveDown()
                    e.code === 'ArrowUp' && moveUp()
                    break
                default:
                    break;
            }
        };
        if (canvas) {
            window.addEventListener('keydown', keyManager);
        }
        return () => {
            if (canvas) {
                window.removeEventListener('keydown', keyManager);
            }
        };
    }, [canvas, activeObject]);
}

export default KeyBoardHandler