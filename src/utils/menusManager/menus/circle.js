import { fabric } from 'fabric';
import { Tool } from '../toolGeneric';

export class Circle extends Tool {
    constructor() {
        super();
        this.origX = null;
        this.origY = null;
        this.pointer = null;
        this.circle = null;
    }

    create(canvas, event) {
        this.pointer = canvas.getPointer(event.e);
        this.origX = this.pointer.x;
        this.origY = this.pointer.y;
        this.circle = new fabric.Circle({
            left: this.origX,
            top: this.origY,
            radius: 1,
            fill: '',
            stroke: 'black',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
        });

        canvas.add(this.circle);
    }

    draw(canvas, event) {
        this.pointer = canvas.getPointer(event.e);
        let radius = Math.sqrt(Math.pow(this.origX - this.pointer.x, 2) + Math.pow(this.origY - this.pointer.y, 2)) / 2;

        this.circle.set({
            radius: radius,
            left: (this.origX + this.pointer.x) / 2,
            top: (this.origY + this.pointer.y) / 2
        });

        canvas.renderAll();
    }
}

