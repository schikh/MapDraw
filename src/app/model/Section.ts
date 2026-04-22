import { jsonIgnore } from "json-ignore";
import { Pole } from "./Pole";
import { LineSection } from "./LineSection";


export class Section {

     @jsonIgnore()
     public startPole: Pole;

    @jsonIgnore()
    public endPole: Pole;

    /** Span length between the two poles (m), computed from pole positions */
     @jsonIgnore()
     public length: number;

     @jsonIgnore()
     public lineSections: LineSection[] = [];

     @jsonIgnore()
     public angle: number;

    constructor(startPole: Pole, endPole: Pole) {
        this.startPole = startPole;
        this.endPole = endPole;
        this.length = startPole.distanceTo(endPole);
        this.angle = startPole.angleTo(endPole);
    }

    public static fromJSON(json: any, startPole: Pole, endPole: Pole): Section {
        return new Section(startPole, endPole);
    }

    // public calcLineSectionMecanicalsConstraints(): void {
    //     this.lineSections.forEach ( ls => {
    //         ls.calcLineSectionMecanicalsConstraints();
    //     });
    // }
}
