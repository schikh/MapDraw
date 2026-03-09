import { Pole } from "./Pole.js";

export class Section {
    /** Pole at the start of the section */
    public startPole: Pole;

    /** Pole at the end of the section */
    public endPole: Pole;

    /** Span length between the two poles (m), computed from pole positions */
    public length: number;

    constructor(startPole: Pole, endPole: Pole) {
        this.startPole = startPole;
        this.endPole = endPole;
        this.length = startPole.distanceTo(endPole);
    }
}
