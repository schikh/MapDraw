import { LineSection } from "./LineSection";

export class Line {
    /** Cable type identifier */
    public type: string;

    /** Cross-section area (mm²) */
    public sectionArea: number;

    /** Cable diameter (mm) */
    public diameter: number;

    /** Linear weight of the cable (kg/mm²/km) */
    public weight: number;

    /** Weight of surrounding/attached cables (kg/m) */
    public carrierWeight: number;

    /** Thermal expansion coefficient (°C⁻¹) */
    public expansionCoefficient: number;

    /** Young's modulus (kg/mm²) */
    public elasticityModulus: number;

    /**
     * Specific weight derived from weight.
     * Converted from kg/mm²/km to kg/mm²/m  (= weight / 1000).
     */
    public specificWeight: number;

    /** Usual maximum allowable stress (kg/mm²) */
    public normalTraction: number;

    /** Collection of LineSections that reference this line */
    public lineSections: LineSection[] = [];

    public createdAt: string;

    constructor(params: {
        type: string;
        sectionArea: number;
        diameter: number;
        weight: number;
        carrierWeight: number;
        expansionCoefficient: number;
        elasticityModulus: number;
        normalTraction: number;
    }) {
        this.type = params.type;
        this.sectionArea = params.sectionArea;
        this.diameter = params.diameter;
        this.weight = params.weight;
        this.createdAt = new Date().toISOString();
        this.carrierWeight = params.carrierWeight;
        this.expansionCoefficient = params.expansionCoefficient;
        this.elasticityModulus = params.elasticityModulus;
        this.normalTraction = params.normalTraction;

        // Convert from kg/mm²/km  →  kg/mm²/m
        this.specificWeight = params.weight / 1000;
    }
}
