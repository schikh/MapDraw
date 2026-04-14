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

    constructor(startPole: Pole, endPole: Pole) {
        this.startPole = startPole;
        this.endPole = endPole;
        this.length = startPole.distanceTo(endPole);
    }

    public static fromJSON(json: any, startPole: Pole, endPole: Pole): Section {
        return new Section(startPole, endPole);
    }

    public calcLineSectionMecanicalsConstraints(): void {
        this.lineSections.forEach (ls => {
            //TODO: rename maxConstraint into Constraint
            ls.mecanicalConstraintStart = ls.line.maxConstraint / ls.line.hangingHeight * this.startPole.aboveGroundHeight;
            ls.mecanicalConstraintEnd = ls.line.maxConstraint / ls.line.hangingHeight * this.endPole.aboveGroundHeight;
        });
    }
}
