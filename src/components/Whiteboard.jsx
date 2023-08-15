import '../assets/styles/whiteboard.css';
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { draw, create } from "../utils/assignUtil";


const Whiteboard = ({ tool }) => {
  const canvasRef = useRef(null);
  let isSelected = false;
  let isDown;

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current);

    // Load canvas from session storage if it exists
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
        draw(tool, canvas, e);
        canvas.renderAll();
        return;
      }
    });

    canvas.on('mouse:up', function (e) {
      isDown = false;
      isSelected = true;
    });

    // Clean up and save to session storage
    return () => {
      sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
      canvas.dispose();
    };
  }, [tool]);

  return (
    <div>
      <canvas ref={canvasRef} id="c" width="800" height="600" />
    </div>
  );
};

export default Whiteboard;
