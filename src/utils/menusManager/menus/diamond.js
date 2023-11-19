import {fabric} from 'fabric';
import {Tool} from '../toolGeneric';

//https://stackoverflow.com/questions/41678349/creating-polygon-shapes-via-mouse-drag-does-not-center-the-shape-to-its-selectio
export class Diamond extends Tool {
    constructor() {
        super();
        this.origX = null;
        this.origY = null;
        this.pointer = null;
        this.diamond = null;
        this.offset = 50;
    }

    create(canvas, event) {
        this.pointer = canvas.getPointer(event.e);
        this.origX = this.pointer.x;
        this.origY = this.pointer.y;
        this.diamond = new fabric.Polygon([
            {x: this.origX, y: this.origY},
            {x: this.origX + this.offset, y: this.origY + this.offset},
            {x: this.origX, y: this.origY + this.offset * 2},
            {x: this.origX - this.offset, y: this.origY + this.offset},
        ], {
            fill: '',
            stroke: 'black',
            strokeWidth: 1,
            originX: 'center',
            originY: 'center',
            objectCaching: false, // Recalculate bounding box dynamically
        });
        canvas.add(this.diamond);
    }

    draw(canvas, event) {
        if (!this.diamond) {
            return;
        }

        this.pointer = canvas.getPointer(event.e);

        // Calculate new dimensions based on the distance from the original position
        const deltaX = this.pointer.x - this.origX;
        const deltaY = this.pointer.y - this.origY;

        // Calculate new pathOffset
        const newOffsetX = this.origX + deltaX / 2;
        const newOffsetY = this.origY + deltaY / 2;

        // Update the polygon's points based on the new dimensions
        this.diamond.set({
            points: [
                {x: this.origX, y: this.origY},
                {x: this.origX + deltaX, y: this.origY + deltaY},
                {x: this.origX, y: this.origY + deltaY * 2},
                {x: this.origX - deltaX, y: this.origY + deltaY},
            ],
            pathOffset: {x: newOffsetX, y: newOffsetY}, // Set the new pathOffset
            hasControls: true,
            hasBorders: true,
        });

        this.diamond._calcDimensions();
        canvas.requestRenderAll();
    }
}