import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { draw, create } from "../utils/assignUtil";
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
      // opem file dialog
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (f) => {
          const data = f.target.result;
          fabric.Image.fromURL(data, (img) => {
            const oImg = img.set({ left: 0, top: 0 ,width:150,height:150});
            canvas.add(oImg).renderAll();

          });
        };
      };
      input.click();
      setToolCallBack('cursor');
    }

    canvas.on('mouse:down', function (e) {
      isDown = true;
      if (onMoveTools.includes(tool)) {
        create(tool, canvas, e);
      }
      return ;
    });

    canvas.on('mouse:move', function (e) {
      if (!isDown) return;

      if (onMoveTools.includes(tool)) {
        canvas.selection = false;
        draw(tool, canvas, e);
      }
      canvas.renderAll();
      return;
    });

    canvas.on('mouse:up', function (e) {

      sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
      if (onMoveTools.includes(tool)) {
        isDown = false;
        setToolCallBack('cursor');
      }
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
      if (e.keyCode === 46) {
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
