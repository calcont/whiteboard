export const handleDeleteSelected = (canvas) => { 
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
