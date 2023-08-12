import '../assets/styles/whiteboard.css';
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { draw, create } from "../utils/assignUtil";


const Whiteboard = ({ tool }) => {
  const canvasRef = useRef(null);
  let rect, isDown, origX, origY;
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current);

    canvas.on('mouse:down', function (o) {
      isDown = true;
      draw(tool);
      console.log(tool);
    });

    canvas.on('mouse:move', function (o) {
      if (!isDown) return;
      let pointer = canvas.getPointer(o.e);
    });

    canvas.on('mouse:up', function (o) {
      isDown = false;
    });

    return () => canvas.dispose();
  }, [tool]);

  return (
    <div>
      <canvas ref={canvasRef} id="c" width="800" height="600" />
    </div>
  );
};

export default Whiteboard;
