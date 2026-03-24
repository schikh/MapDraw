import { appSettings, Cable } from "../config/AppSettings";
import { LineSection } from "./LineSection";

export class Line {

    constructor(type: string) {
      this.type = type;
    }

    public type: string;

    get cable(): Cable {
      return appSettings.getCable(this.type)!;
    }

    /** Collection of LineSections that reference this line */
    public lineSections: LineSection[] = [];

    public maxConstraint: number = 0;

    // constructor(params: {
    //     type: Line;
    //     sectionArea: number;
    //     diameter: number;
    //     weight: number;
    //     carrierWeight: number;
    //     expansionCoefficient: number;
    //     elasticityModulus: number;
    //     normalTraction: number;
    //     specificWeight: number;
    // }) {
    //     this.type = params.type;
    //     this.sectionArea = params.sectionArea;
    //     this.diameter = params.diameter;
    //     this.weight = params.weight;
    //     this.createdAt = new Date().toISOString();
    //     this.carrierWeight = params.carrierWeight;
    //     this.expansionCoefficient = params.expansionCoefficient;
    //     this.elasticityModulus = params.elasticityModulus;
    //     this.normalTraction = params.normalTraction;
    //     this.specificWeight = params.specificWeight;
    // }

    public static fromJSON(json: any): Line {
        const line = new Line(json.type);
        line.maxConstraint = json.maxConstraint ?? 0;
        return line;
    }
}
