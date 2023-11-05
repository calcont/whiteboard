import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { draw, create } from "../utils/";
import { handleMouseDown, handleMouseMove, handleMouseUp, handleDeleteSelected, addImage } from '../utils';
import '../assets/styles/whiteboard.css';

const Whiteboard = ({ tool, setToolCallBack }) => {
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
      return;
    });

    canvasInstance.on('mouse:move', function (e) {
      if (!isDown.current) return;
      handleMouseMove(canvasInstance, tool, draw, e);
      return;
    });

    canvasInstance.on('mouse:up', () => {
      isDown.current = false;
      handleMouseUp(canvasInstance, tool, setToolCallBack);
      return;
    });

    const keyManager = (e) => {
      if (e.keyCode === 46) {
        handleDeleteSelected(canvasInstance);
      }
    }

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

export default Whiteboard;
