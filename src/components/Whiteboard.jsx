import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { draw, create } from "../utils/";
import { handleMouseDown, handleMouseMove, handleMouseUp, handleDeleteSelected,addImage } from '../utils';
import '../assets/styles/whiteboard.css';


const Whiteboard = ({ tool, setToolCallBack }) => {
  const canvasRef = useRef(null);
  const onMoveTools = ['marker', 'rectangle', 'circle', 'arrow'];
  let isDown;

  useEffect(() => {
    const canvas = tool === "marker" ? new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
    }) : new fabric.Canvas(canvasRef.current);

    canvas.setWidth(window.screen.width);
    canvas.setHeight(window.screen.height);

    const savedCanvas = sessionStorage.getItem('canvas');
    if (savedCanvas) {
      canvas.loadFromJSON(savedCanvas, canvas.renderAll.bind(canvas));
    }

    if (tool === "image") {
      addImage(canvas);
    }

    canvas.on('mouse:down', function (e) {
      isDown = true;
      handleMouseDown(canvas, tool, onMoveTools, create, e);
      return;
    });

    canvas.on('mouse:move', function (e) {
      if (!isDown) return;
      handleMouseMove(canvas, tool, onMoveTools, draw, e);
      return;
    });

    canvas.on('mouse:up', () => {
      isDown = false;
      handleMouseUp(canvas, tool, onMoveTools, setToolCallBack);
      return;
    });

    const keyManager = (e) => {
      if (e.keyCode === 46) {
        handleDeleteSelected(canvas);
      }
    }

    window.addEventListener('keydown', keyManager);

    return () => {
      window.removeEventListener('keydown', keyManager); // Remove event listener on component unmount
      canvas.dispose();
    };
  }, [tool]);

  return (
    <div>
      <canvas ref={canvasRef} id='canvas' >Drawing canvas</canvas>
    </div>
  );
};

export default Whiteboard;
