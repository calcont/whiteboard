import {fabric} from 'fabric';
import {Tool} from '../toolGeneric';

export class Rectangle extends Tool {

    constructor() {
        super();
        this.origX = null;
        this.origY = null;
        this.pointer = null;
        this.pointer2 = null;
        this.rect = null;
    }

    create(canvas, event) {
        this.pointer = canvas.getPointer(event.e);
        this.origX = this.pointer.x;
        this.origY = this.pointer.y;
        this.pointer2 = canvas.getPointer(event.e);
        this.rect = new fabric.Rect({
            left: this.origX,
            top: this.origY,
            originX: 'left',
            originY: 'top',
            fill: 'transparent',
            stroke: 'black',
            strokeWidth: 3,
            selectable:true,
            width: this.pointer2.x - this.origX,
            height: this.pointer2.y - this.origY,
        });
        canvas.add(this.rect);
    }

    draw(canvas, event) {
        if (!this.rect) {
            return;
        }
        this.pointer = canvas.getPointer(event.e);
        if (this.origX > this.pointer.x) { // updating up left boundary
            this.rect.set({left: Math.abs(this.pointer.x)});
        }
        if (this.origY > this.pointer.y) {
            this.rect.set({top: Math.abs(this.pointer.y)});
        }
        this.rect.set({width: Math.abs(this.origX - this.pointer.x)});
        this.rect.set({height: Math.abs(this.origY - this.pointer.y)});
    }

    done(canvas) {
        if (this.rect.height < 5) {
            canvas.remove(this.rect);
        }
    }
}