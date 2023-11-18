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
        this.sides = 4;
        this.offset = 50;
    }

    create(canvas, event) {
        this.pointer = canvas.getPointer(event.e);
        this.origX = this.pointer.x;
        this.origY = this.pointer.y;
        this.diamond = new fabric.Polygon([
            { x: this.origX, y: this.origY },
            { x: this.origX + this.offset, y: this.origY + this.offset },
            { x: this.origX, y: this.origY + this.offset * 2 },
            { x: this.origX - this.offset, y: this.origY + this.offset },
        ], {
            fill: '',
            stroke: 'black',
            strokeWidth: 2,
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

        // Update the polygon's points based on the new dimensions
        this.diamond.set({
            points: this.calcPolygonPoints(this.sides, Math.abs( this.origX - this.pointer.x ) / 2 ),
            hasControls: true,
            hasBorders: true,
        });
        this.diamond._calcDimensions();
        this.diamond.setCoords();
        canvas.requestRenderAll();
    }

    calcPolygonPoints = (sideCount, radius) => {
        let sweep = Math.PI * 2 / sideCount;
        let cx = radius;
        let cy = radius;
        let points = []

        for (let i = 0; i < sideCount; i++) {
            let x = cx + radius * Math.cos(i * sweep)
            let y = cy + radius * Math.sin(i * sweep)
            points.push({x: x, y: y})
        }
        return (points)
    }
}