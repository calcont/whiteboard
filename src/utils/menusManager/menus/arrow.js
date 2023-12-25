import {fabric} from 'fabric';
import {Tool} from '../toolGeneric';

export class Arrow extends Tool {

    constructor() {
        super();
        this.origX = null;
        this.origY = null;
        this.pointer = null;
        this.line = null;
        this.arrowHead = null;
        this.arrow = null;
        this.deleteOffset = 20;
    }

    create(canvas, event) {
        this.pointer = canvas.getPointer(event.e);
        this.origX = this.pointer.x;
        this.origY = this.pointer.y;
        let linePath = `M ${this.origX} ${this.origY} L ${this.origX} ${this.origY}`;
        let arrowHeadPath = "M 0 0 L 20 10 L 0 20 Z";

        this.line = new fabric.Path(linePath, {
            stroke: 'black',
            strokeWidth: 2,
            fill: 'black',
            originX: 'center',
            originY: 'center',
            objectCaching: false,
            hasControls: false,
            hasBorders: false,
            selectable: false,
        })

        this.arrowHead = new fabric.Path(arrowHeadPath, {
            stroke: '',
            strokeWidth: 0,
            fill: 'black',
            originX: 'center',
            originY: 'center',
            hasControls: false,
            hasBorders: false,
            top: this.origY,
            left: this.origX,
            selectable: false,
        })
        canvas.add(this.line, this.arrowHead);
        canvas.requestRenderAll();
    }

    draw(canvas, event) {
        if (!this.line) {
            return;
        }
        this.pointer = canvas.getPointer(event.e);
        this.line.path[1][1] = this.pointer.x;
        this.line.path[1][2] = this.pointer.y;
        this.line.setCoords();
        this.arrowHead.left = this.pointer.x;
        this.arrowHead.top = this.pointer.y;
        this.arrowHead.angle = this.calcArrowAngle(this.pointer, this.origX, this.origY)
        this.arrowHead.setCoords();
    }

    done(canvas) {
        let width = Math.abs(this.pointer.x - this.origX);
        if (width < this.deleteOffset) {
            canvas.remove(this.line, this.arrowHead);
            canvas.requestRenderAll();
            return;
        }
        this.arrow = new fabric.Group([this.line, this.arrowHead], {
            objectCaching: false,
        })
        canvas.remove(this.line, this.arrowHead);
        canvas.add(this.arrow);
        canvas.requestRenderAll();
    }

    calcArrowAngle(pointer, origX, origY) {
        let angle = Math.atan2(pointer.y - origY, pointer.x - origX) * 180 / Math.PI;
        return angle;
    }
}