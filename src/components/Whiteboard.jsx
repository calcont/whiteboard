import React from 'react'
import '../assets/styles/whiteboard.css';
import { useState, useEffect,useRef } from 'react';
import { RoughCanvas } from "roughjs/bin/canvas";
import rough from "roughjs/bin/rough";
import { debounce } from 'lodash';

const Whiteboard = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rc = rough.canvas(canvas);

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a rectangle using rough.js
    const rectangle = rc.rectangle(50, 50, 200, 100);

  }, []);

  useEffect(() => {
    
  } , [canvasRef])

  const draw = (x1,y1) => {
  
    const rectangle = rc.rectangle(x1,y1, 200, 100);
  }

  // const 

  return <canvas ref={canvasRef} width={800} height={600} />;

}

export default Whiteboard;