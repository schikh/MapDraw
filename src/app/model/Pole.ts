import { Position } from "./Position";

export class Pole {

    public id: number;

    /** Allowable load (kg) */
    public strength: number;

    /** Total height of the pole (m) */
    public height: number;

    public rotation: number;

    /** Height above ground level (m) */
    public aboveGroundHeight: number;

    /** 3-D position of the pole */
    public position: Position;

    //public coordinates: [number, number];

    public createdAt: string;

    constructor(id: number, strength: number, height: number, rotation: number, aboveGroundHeight: number, position: Position) {
        this.id = id;
        this.strength = strength;
        this.height = height;
        this.rotation = rotation;
        this.aboveGroundHeight = aboveGroundHeight;
        this.position = position;
        //this.coordinates = [this.position.x, this.position.y];
        this.createdAt = new Date().toISOString();
    }
    /**
     * Euclidean distance to another pole.
     */
    public distanceTo(other: Pole): number {
        return this.position.distanceTo(other.position);
    }

    public static fromJSON(json: any): Pole {
        const position = Position.fromJSON(json.position);
        return new Pole(
            json.id,
            json.strength,
            json.height,
            json.rotation,
            json.aboveGroundHeight,
            position
        );
    }
}
