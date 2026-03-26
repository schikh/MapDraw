import { Calculator } from "../services/Calculator";
import { Line } from "./Line";
import { Section } from "./Section";
import { settings } from "../config/Settings";
import { jsonIgnore } from "json-ignore";

export class LineSection {
    /** The cable/line running through this section */
    @jsonIgnore()
    public line: Line;

    /** The section (span between two poles) */
    @jsonIgnore()
    public section: Section;

    constructor(line: Line, section: Section) {
        this.line = line;
        this.section = section;
    }

    public constraint: number = 0; // Current tension constraint (kg/mm²)

    /**
     * Computes all overload parameters for this LineSection's line and section.
     *
     * @param windSpeed  Wind speed (m/s) — defaults to settings.WindSpeed
     */
    public getOverloadParameters(
        windSpeed: number = settings.WindSpeed,
    ): {
        overloadNoWind: number;
        summerOverload: number;
        winterOverload: number;
        overload: number;
        criticalTemperature: number;
    } {
        const cable = this.line.cable;
        const sectionLength = this.section.length;
        const diameterInMeters = cable.diameter / 1000;

        const summerWindForce = Calculator.getSummerWindForcePerMeter(
            sectionLength,
            diameterInMeters,
            windSpeed,
        );
        const winterWindForce = Calculator.getWinterWindForcePerMeter(
            diameterInMeters,
            windSpeed,
        );

        const { overloadNoWind, summerOverload, winterOverload } =
            Calculator.getOverloadCoefficients(
                cable.weight,
                cable.carrierWeight,
                summerWindForce,
                winterWindForce,
            );

        const criticalLength = Calculator.getCriticalLength(
            cable.normalTraction,
            cable.sectionArea,
            cable.weight,
            cable.expansionCoefficient,
            summerOverload,
            winterOverload,
        );

        const { overload, criticalTemperature } = Calculator.getCriticalTemperature(
            sectionLength,
            criticalLength,
            winterOverload,
            summerOverload,
        );

        return {
            overloadNoWind,
            summerOverload,
            winterOverload,
            overload,
            criticalTemperature,
        };
    }

    /**
     * Calculate the cable constraint at a new condition
     * using this LineSection's line properties and section length.
     *
     * @param constraint1  Known tension (kg/mm²)
     * @param temp1        Temperature at the known state (°C)
     * @param overload1    Overload coefficient at the known state
     * @param temp2        Temperature at the target state (°C)
     * @param overload2    Overload coefficient at the target state
     * @returns  Cable tension at the target state (kg/mm²)
     */
    public calcConstraintAtConditions(
        constraint1: number,
        temp1: number,
        overload1: number,
        temp2: number,
        overload2: number,
    ): number {
        return Calculator.calcConstraint(
            constraint1,
            temp1,
            overload1,
            temp2,
            overload2,
            this.section.length,
            this.line.cable.elasticityModulus,
            this.line.cable.specificWeight,
            this.line.cable.expansionCoefficient,
        );
    }

    public static fromJSON(json: any, line: Line, section: Section): LineSection {
        const lineSection = new LineSection(line, section);
        lineSection.constraint = json.constraint ?? 0;
        return lineSection;
    }
}
