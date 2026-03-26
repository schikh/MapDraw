import { jsonIgnore } from "json-ignore";
import { Line } from "./Line";
import { LineSection } from "./LineSection";
import { Pole } from "./Pole";
import { Section } from "./Section";

/**
 * A Canton is a sequence of poles connected in a straight line.
 *
 * - Adding a pole auto-creates a Section between the previous last pole and the new one.
 * - Adding a line creates a LineSection for every Section in the canton
 *   (the line spans the full extent of the canton).
 */
export class Canton {
    
    public id: number;
    
    @jsonIgnore()
    public poles: Pole[] = [];
    
    public sections: Section[] = [];
    public lines: Line[] = [];
    public poleIds: number[] = []; // Array of pole IDs forming the polyline
    public createdAt: string;

    constructor(id: number) {
        this.id = id;
        this.createdAt = new Date().toISOString();
    }

    /**
     * Append a pole to the canton.
     *
     * If there is already at least one pole, a Section is created between the
     * current last pole and the newly added pole. The span length is computed
     * automatically from the poles' (x, y, z) positions.
     *
     * @param pole  The pole to add
     */
    public addPole(pole: Pole): void {
        if (this.poles.length > 0) {
            const lastPole = this.poles[this.poles.length - 1];
            const section = new Section(lastPole, pole);
            this.sections.push(section);
        }
        this.poles.push(pole);
        this.poleIds.push(pole.id);
    }

    /**
     * Add a line to the canton.
     *
     * Creates one LineSection per existing Section (the line runs through
     * every span from the first pole to the last pole).
     *
     * @param line  The cable/line to add
     */
    public addLine(line: Line): void {
        if (this.sections.length === 0) {
            throw new Error(
                "Cannot add a line: the canton has no sections (add at least two poles first).",
            );
        }

        this.lines.push(line);

        for (const section of this.sections) {
            const ls = new LineSection(line, section);
            line.lineSections.push(ls);
        }
    }

    public static fromJSON(json: any, poles: Pole[]): Canton {
        const canton = new Canton(json.id);
        canton.poleIds = json.poleIds ?? [];
        canton.createdAt = json.createdAt;
        canton.poles = canton.poleIds.map((id: number) => poles.find(p => p.id === id)!);

        //canton.sections = (json.sections ?? []).map((s: any, index: number) => Section.fromJSON(s, canton.poles[index], canton.poles[index + 1]));
        canton.sections = [];
        for(var i=0; i<json.sections.length; i++) {
          var jsonSection = json.sections[i];
          var section = Section.fromJSON(jsonSection, canton.poles[i], canton.poles[i + 1]);
          canton.sections.push(section);
        }

        //canton.lines = (json.lines ?? []).map((l: any) => Line.fromJSON(l, canton.sections));
        canton.lines = [];
        for(var i=0; i<json.lines.length; i++) {
          var jsonLine = json.lines[i];
          var line = Line.fromJSON(jsonLine, canton.sections);
          canton.lines.push(line);
        }

        return canton;
    }
}
