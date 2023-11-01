import { fabric } from 'fabric';

export const addImage = (canvas) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (f) => {
            const data = f.target.result;
            fabric.Image.fromURL(data, (img) => {
                //scale down image
                const oImg = img.set({ left: 0, top: 0, angle: 0 }).scale(0.5);
                canvas.add(oImg);
sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
            });
        };
    };
    input.click();
}