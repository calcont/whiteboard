import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { draw, create } from "../utils/assignUtil";
import '../assets/styles/whiteboard.css';


const Whiteboard = ({ tool, setToolCallBack }) => {
  const canvasRef = useRef(null);
  let isSelected = false;
  let isDown;

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current);

    canvas.setWidth(window.screen.width);
    canvas.setHeight(window.screen.height);

    const savedCanvas = sessionStorage.getItem('canvas');
    if (savedCanvas) {
      canvas.loadFromJSON(savedCanvas, canvas.renderAll.bind(canvas));
    }

    canvas.on('mouse:down', function (e) {
      isDown = true;
      return isSelected ? null : create(tool, canvas, e);
    });

    canvas.on('mouse:move', function (e) {
      if (!isDown) return;

      if (!isSelected) {
        canvas.selection = false;
        draw(tool, canvas, e);
        canvas.renderAll();
        return;
      }
    });

    canvas.on('mouse:up', function (e) {
      isDown = false;
      isSelected = true;
      canvas.selection = true;
      sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
      setToolCallBack('cursor');
    });

    const deleteSelected = () => {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects) {
        activeObjects.forEach((object) => {
          canvas.discardActiveObject();
          canvas.remove(object);
        });
        sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
        canvas.renderAll();
      }
    }

    const keyManager = (e) => {
      if (e.keyCode === 46 || e.keyCode === 8) {
        deleteSelected();
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
