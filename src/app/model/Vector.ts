import { Position } from "./Position";

export class Vector {

    constructor (x: number, y: number) { 
        this.x = x;
        this.y = y;
        this.intensity = Math.sqrt(x**2 + y**2);
        this.angle = Math.atan2(y, x);
    }

    x: number;
    y: number;
    intensity: number;
    angle: number;

    add(v2 : Vector): Vector {
        let x = this.x + v2.x;
        let y = this.y + v2.y;
        return new Vector(x, y);
    }

    static getVector(windConstraint: number, angle: number): Vector {
        let x = windConstraint * Math.cos(angle);
        let y = windConstraint * Math.sin(angle);
        return new Vector(x, y);
    }
}