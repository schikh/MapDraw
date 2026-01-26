export class Position {
    public x: number = 0;
    public y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public distanceTo(p: Position): number {
        return Math.pow(Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2), 0.5);
    }

    public angleTo(p: Position): number {
        return Math.atan2(p.y - this.y, p.x - this.x);
    }

    public static from(len: number, angle: number): Position {
        return new Position(len * Math.cos(angle), len * Math.sin(angle));
    }

    public static add(a: Position, b: Position): Position {
        return new Position(a.x + b.x, a.y + b.y);
    }

    public static subtract(a: Position, b: Position): Position {
        return new Position(a.x - b.x, a.y - b.y);
    }

    public add(other: Position): Position {
        return Position.add(this, other);
    }

    public subtract(other: Position): Position {
        return Position.subtract(this, other);
    }

    public equals(other: Position): boolean {
        return Math.abs(this.x - other.x) <= 0.1 && Math.abs(this.y - other.y) <= 0.1;
    }
}
