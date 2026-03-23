export class Position {
    /** X coordinate (m) */
    public x: number;

    /** Y coordinate (m) */
    public y: number;

    /** Z coordinate / elevation (m) */
    public z: number;

    constructor(x: number, y: number, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Euclidean distance to another position.
     * d = √((x₂−x₁)² + (y₂−y₁)² + (z₂−z₁)²)
     */
    public distanceTo(other: Position): number {
        return Math.sqrt(
            (other.x - this.x) ** 2 +
            (other.y - this.y) ** 2 +
            (other.z - this.z) ** 2,
        );
    }
}
