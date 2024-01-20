import {fabric} from 'fabric';
import {Tool} from '../toolGeneric';

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
        this.circle = new fabric.Ellipse({
            left: this.origX,
            top: this.origY,
            radius: 1,
            fill: '',
            stroke: 'black',
            strokeWidth: 3
        });
        canvas.add(this.circle);
    }

    draw(canvas, event) {
        if (!this.circle) {
            return;
        }
        this.pointer = canvas.getPointer(event.e);
        if (this.pointer.x < this.origX) {
            this.circle.set('left', this.pointer.x);
        }
        if (this.pointer.y < this.origY) {
            this.circle.set('top', this.pointer.y);
        }
        this.circle.set({
            rx: Math.abs(this.pointer.x - this.origX) / 2,
            ry: Math.abs(this.pointer.y - this.origY) / 2,
        });
        this.circle.setCoords();
        canvas.renderAll();
    }

    done(canvas) {
        if (this.circle.height < 5) {
            canvas.remove(this.circle);
        }
    }
}

