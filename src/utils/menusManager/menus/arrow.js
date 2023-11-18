import {fabric} from 'fabric';
import {Tool} from '../toolGeneric';

export class Arrow extends Tool {

        constructor() {
            super();
            this.origX = null;
            this.origY = null;
            this.pointer = null;
            this.pointer2 = null;
            this.arrow = null;
        }

        create(canvas, event) {
            this.pointer = canvas.getPointer(event.e);
            this.origX = this.pointer.x;
            this.origY = this.pointer.y;
            this.pointer2 = canvas.getPointer(event.e);
            this.arrow = new fabric.Line([this.origX, this.origY, this.pointer2.x, this.pointer2.y], {
                left: this.origX,
                top: this.origY,
                originX: 'left',
                originY: 'top',
                fill: 'transparent',
                stroke: 'black',
                strokeWidth: 2,
                width: this.pointer2.x - this.origX,
                height: this.pointer2.y - this.origY,
            });
            canvas.add(this.arrow);
        }

        draw(canvas, event) {
            if (!this.arrow) {
                return;
            }
            this.pointer = canvas.getPointer(event.e);
            if (this.origX > this.pointer.x) {
                this.arrow.set({left: Math.abs(this.pointer.x)});
            }
            if (this.origY > this.pointer.y) {
                this.arrow.set({top: Math.abs(this.pointer.y)});
            }
            this.arrow.set({width: Math.abs(this.origX - this.pointer.x)});
            this.arrow.set({height: Math.abs(this.origY - this.pointer.y)});
        }
}