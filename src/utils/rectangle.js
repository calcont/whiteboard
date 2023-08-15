import { fabric } from 'fabric';


let origX, origY, pointer, rect, pointer2;

const createRectangle = (canvas, event) => {
  
  pointer = canvas.getPointer(event.e);
  origX = pointer.x;
  origY = pointer.y;
  pointer2 = canvas.getPointer(event.e);
  rect = new fabric.Rect({
    left: origX,
    top: origY,
    originX: 'left',
    originY: 'top',
    backgroundColor: 'green',
    width: pointer2.x - origX,
    height: pointer2.y - origY,
  });
  canvas.add(rect);
}

const drawRectangle = (canvas, event) => {

  pointer = canvas.getPointer(event.e);
  if (origX > pointer.x) {
    rect.set({ left: Math.abs(pointer.x) });
  }
  if (origY > pointer.y) {
    rect.set({ top: Math.abs(pointer.y) });
  }
  rect.set({ width: Math.abs(origX - pointer.x) });
  rect.set({ height: Math.abs(origY - pointer.y) });
}

export { createRectangle, drawRectangle };