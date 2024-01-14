import { fabric } from 'fabric';

const AUTO_SCALE = 0.25;
export const Image = (canvas) => {
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
                const oImg = img.set({ left: 0, top: 0 , angle: 0 }).scale(autoScaleByImageSize(canvas, img));
                canvas.add(oImg);
                // sessionStorage.setItem('canvas', JSON.stringify(canvas.toJSON()));
            });
        };
    };
    input.click();
}

function autoScaleByImageSize(canvas, img) {
    const { width, height } = img;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;
    return Math.min(scaleX*AUTO_SCALE, scaleY*AUTO_SCALE);
}