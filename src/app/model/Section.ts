import { jsonIgnore } from "json-ignore";
import { Pole } from "./Pole";

export class Section {

     @jsonIgnore()
     public startPole: Pole;

    @jsonIgnore()
    public endPole: Pole;

    /** Span length between the two poles (m), computed from pole positions */
     @jsonIgnore()
     public length: number;

    constructor(startPole: Pole, endPole: Pole) {
        this.startPole = startPole;
        this.endPole = endPole;
        this.length = startPole.distanceTo(endPole);
    }

    public static fromJSON(json: any, startPole: Pole, endPole: Pole): Section {
        return new Section(startPole, endPole);
    }
}
