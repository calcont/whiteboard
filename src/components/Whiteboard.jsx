import React, {useEffect, useRef} from 'react';
import {fabric} from 'fabric';
import {draw, create} from "../utils/";
import {handleMouseDown, handleMouseMove, handleMouseUp, addImage} from '../utils';
import '../assets/styles/whiteboard.css';

const Whiteboard = ({tool, setToolCallBack}) => {
    const canvasRef = useRef(null);
    const isDown = useRef(false);
    const canvas = useRef(null);

    useEffect(() => {
        if (!canvas.current) {
            canvas.current = new fabric.Canvas(canvasRef.current, {
                isDrawingMode: false,
                selection: true,
            });
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
        tool === "marker" ? canvas.current.isDrawingMode = true : canvas.current.isDrawingMode = false;
        const canvasInstance = canvas.current;
        canvasInstance.off('mouse:down');
        canvasInstance.off('mouse:move');
        canvasInstance.off('mouse:up');

        if (tool === "image") {
            addImage(canvasInstance);
        }

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
            handleMouseUp(canvasInstance, tool, setToolCallBack);
        });

        const keyManager = (e) => {
            if (e.keyCode === 46) {   //delete selected objects
                handleDeleteSelected(canvasInstance);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {  //duplicate selected objects
                e.preventDefault();
                duplicateObjects(canvasInstance);
            }
            else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {  // select all objects
                e.preventDefault();
                selectAllObjects(canvasInstance);
            }
        };

        window.addEventListener('keydown', keyManager);

        return () => {
            window.removeEventListener('keydown', keyManager);
        };
    }, [tool]);

    return (
        <div>
            <canvas ref={canvasRef} id='canvas'>Drawing canvas</canvas>
        </div>
    );
};

const handleDeleteSelected = (canvas) => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects) {
        activeObjects.forEach((object) => {
            canvas.discardActiveObject();
            canvas.remove(object);
        });
        // sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
        canvas.renderAll();
    }
};

// reference :- http://fabricjs.com/copypaste
const duplicateObjects = (canvas) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.clone((clonedObj) => {
            canvas.discardActiveObject();
            clonedObj.set({
                left: clonedObj.left + 10,
                top: clonedObj.top + 10,
                evented: true,
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

export default Whiteboard;
