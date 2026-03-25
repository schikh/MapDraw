import { jsonIgnore } from "json-ignore";
import { appSettings, Cable } from "../config/AppSettings";
import { LineSection } from "./LineSection";
import { Section } from "./Section";

export class Line {

    constructor(type: string) {
      this.type = type;
    }

    public type: string;

    public lineSections: LineSection[] = [];

    public maxConstraint: number = 0;

    @jsonIgnore()
    get cable(): Cable {
      return appSettings.getCable(this.type)!;
    }

    public static fromJSON(json: any, sections: Section[]): Line {
        const line = new Line(json.type);

        line.lineSections = [];
        for(var i=0; i<line.lineSections.length; i++) {
          var jsonLs = json.lineSections[i];
          var section = sections[i];
          var ls = LineSection.fromJSON(jsonLs, line, section);
          line.lineSections.push(ls);
        }

        line.maxConstraint = json.maxConstraint ?? 0;
        return line;
    }
}
