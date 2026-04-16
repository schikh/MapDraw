import { Position } from "./Position";

export class Vector {

    constructor (x: number, y: number) { 
        this.x = x;
        this.y = y;
    }

    x: number;
    y: number;

    add(v2 : Vector): Vector {
        let x = this.x + v2.x;
        let y = this.y + v2.y;
        return new Vector(x, y);
    }

    static getVector(intensity: number, startPos: Position, endPos: Position): Vector {
        const X = endPos.x - startPos.x;
        const Y = endPos.y - startPos.y;
        const H = Math.sqrt(X**2 + Y**2);
        const x = intensity * X / H;
        const y = intensity * Y / H;
        return new Vector(x, y);
    }
}