import { fabric } from 'fabric';

let origX, origY, pointer, circle;

const createCircle = (canvas, event) => {
    pointer = canvas.getPointer(event.e);
    origX = pointer.x;
    origY = pointer.y;

    circle = new fabric.Circle({
        left: origX,
        top: origY,
        radius: 1, // Start with a very small radius
        fill: 'green',  // 'backgroundColor' is not typically used for circles
        originX: 'center',
        originY: 'center',
    });

    canvas.add(circle);
}

const drawCircle = (canvas, event) => {
    pointer = canvas.getPointer(event.e);
    let radius = Math.sqrt(Math.pow(origX - pointer.x, 2) + Math.pow(origY - pointer.y, 2)) / 2;
    
    circle.set({ 
        radius: radius,
        left: (origX + pointer.x) / 2,
        top: (origY + pointer.y) / 2
    });

    canvas.renderAll();
}

export { createCircle, drawCircle };
