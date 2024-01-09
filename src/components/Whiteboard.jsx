import React, {useEffect, useRef, useState} from 'react';
import {fabric} from 'fabric';
import {draw, create, done} from "../utils/";
import {handleMouseDown, handleMouseMove, handleMouseUp, addImage} from '../utils';
import {TOOL_CONSTANTS} from "../constants/";
import BackgroundColor from "./BackgroundColor";
import '../assets/styles/whiteboard.css';

const Whiteboard = ({tool, setToolCallBack, anchor, lockStatus}) => {
    const canvasRef = useRef(null);
    const isDown = useRef(false);
    const canvas = useRef(null);
    const [isOpenBackground, setIsOpenBackground] = useState(false);

    useEffect(() => {
        if (!canvas.current) {
            canvas.current = new fabric.Canvas(canvasRef.current, {
                isDrawingMode: false,
                selection: true,
            });
            window.canvasI = canvas.current;
            canvas.current.setWidth(window.screen.width);
            canvas.current.setHeight(window.screen.height);
        }
        const canvasInstance = canvas.current;

        const savedCanvas = sessionStorage.getItem('canvas');
        if (savedCanvas) {
            canvasInstance.loadFromJSON(savedCanvas, canvasInstance.renderAll.bind(canvasInstance));
        }
    }, []);

    useEffect(() => {
        if (tool === TOOL_CONSTANTS.MARKER) {
            canvas.current.isDrawingMode = true;
            canvas.current.freeDrawingBrush.width = 3;
        } else canvas.current.isDrawingMode = false;
        const canvasInstance = canvas.current;
        canvasInstance.off('mouse:down');
        canvasInstance.off('mouse:move');
        canvasInstance.off('mouse:up');
        setIsOpenBackground(false)
        handleToolsSettings(canvasInstance, tool, () => setIsOpenBackground(true));

        canvasInstance.on('mouse:down', function (e) {
            isDown.current = true;
            handleMouseDown(canvasInstance, tool, create, e);
        });

        canvasInstance.on('mouse:move', function (e) {
            if (!isDown.current) return;
            handleMouseMove(canvasInstance, tool, draw, e);
        });

        canvasInstance.on('mouse:up', () => {
            isDown.current = false;
            handleMouseUp(canvasInstance, tool, done, setToolCallBack, lockStatus);
        });

        const keyManager = (e) => {
            switch (true) {
                case e.keyCode === 46: // delete selected objects
                    handleDeleteSelected(canvasInstance);
                    break;
                case (e.ctrlKey || e.metaKey) && e.key === 'd': // duplicate selected objects
                    e.preventDefault();
                    duplicateObjects(canvasInstance);
                    break;
                case (e.ctrlKey || e.metaKey) && e.key === 'a': // select all objects
                    e.preventDefault();
                    selectAllObjects(canvasInstance);
                    break;
                default:
                    break;
            }
        };
        window.addEventListener('keydown', keyManager);
        return () => {
            window.removeEventListener('keydown', keyManager);
        };
    }, [tool, lockStatus]);

    return (
        <div>
            <BackgroundColor open={isOpenBackground} anchorEl={anchor} onClose={() => {
                setIsOpenBackground(false);
                setToolCallBack(TOOL_CONSTANTS.CURSOR);
            }}/>
            <canvas ref={canvasRef} id='canvas'>Drawing canvas</canvas>
        </div>
    );
    }
;

const handleDeleteSelected = (canvas) => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects) {
        activeObjects.forEach((object) => {
            if (object._objects) {
                object._objects.forEach((obj) => {
                    canvas.discardActiveObject();
                    canvas.remove(obj);
                });
            }
            canvas.discardActiveObject();
            canvas.remove(object);
        });
        // sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
        canvas.requestRenderAll();
    }
};

// reference :- http://fabricjs.com/copypaste
const duplicateObjects = (canvas) => {
    const activeObject = canvas.getActiveObject();
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

const selectAllObjects = (canvas) => {
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

const handleToolsSettings = (canvas, tool, setOpenBgPanel) => {
    switch (tool) {
        case TOOL_CONSTANTS.CURSOR:
            canvas.getObjects().forEach((obj) => {
                obj.selectable = true;
            });
            canvas.hoverCursor = 'move';
            canvas.defaultCursor = 'default';
            break;
        case TOOL_CONSTANTS.IMAGE:
            addImage(canvas);
            break;
        case TOOL_CONSTANTS.BACKGROUND_COLOR:
            setOpenBgPanel();
            break;
        default:
            const allObjects = canvas.getObjects();
            const lastObject = canvas.item(allObjects.length - 1);
            ;
            if (lastObject && lastObject.type === 'i-text' && lastObject.text === '') {
                lastObject.enterEditing();
                canvas.remove(lastObject);
            }
            canvas.discardActiveObject();
            allObjects.forEach((obj) => {
                obj.selectable = false;
            });
            canvas.hoverCursor = 'cursor';
            canvas.defaultCursor = 'crosshair';
            canvas.renderAll();
            break;
    }
}

export default Whiteboard;
