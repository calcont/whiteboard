let origX,origY,pointer,rect;

const createRectangle = (canvas) => {
    // let pointer = canvas.getPointer(o.e);
    // origX = pointer.x;
    // origY = pointer.y;
    // let pointer2 = canvas.getPointer(o.e);
    // rect = new fabric.Rect({
    //     left: origX,
    //     top: origY,
    //     originX: 'left',
    //     originY: 'top',
    //     backgroundColor: 'transparent',
    //     width: pointer2.x - origX,
    //     height: pointer2.y - origY,
    // });
    // canvas.add(rect);
    console.log("createRectangle");
}

const drawRectangle = (canvas, x, y, width, height, color) => {
    
    if(origX > pointer.x){
        rect.set({ left: Math.abs(pointer.x) });
      }
      if(origY > pointer.y){
        rect.set({ top: Math.abs(pointer.y) });
      }
      rect.set({ width: Math.abs(origX - pointer.x) });
      rect.set({ height: Math.abs(origY - pointer.y) });
      canvas.renderAll();
}