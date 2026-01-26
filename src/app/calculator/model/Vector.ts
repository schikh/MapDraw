export class Vector {
    public x: number = 0;
    public y: number = 0;

    public static from(len: number, angle: number): Vector {
        const v = new Vector();
        v.x = len * Math.cos(angle);
        v.y = len * Math.sin(angle);
        return v;
    }

    public get intensity(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public get angle(): number {
        return Math.atan2(this.y, this.x);
    }

    public reverse(): Vector {
        const v = new Vector();
        v.x = -this.x;
        v.y = -this.y;
        return v;
    }

    public static add(a: Vector, b: Vector): Vector {
        const v = new Vector();
        v.x = a.x + b.x;
        v.y = a.y + b.y;
        return v;
    }

    public static subtract(a: Vector, b: Vector): Vector {
        const v = new Vector();
        v.x = a.x - b.x;
        v.y = a.y - b.y;
        return v;
    }

    public add(other: Vector): Vector {
        return Vector.add(this, other);
    }

    public subtract(other: Vector): Vector {
        return Vector.subtract(this, other);
    }
}
