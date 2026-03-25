import appSettingsJson from './appsettings.json';

// ── Cable ────────────────────────────────────────────────────────────────────

export class Cable {
    /** Cable type identifier (e.g. "3x35+2x16+54,6") */
    type: string;

    /** Cross-section area (mm²) */
    sectionArea: number;

    /** Number of individual wires */
    numberOfWire: number;

    /** Cable diameter (mm) */
    diameter: number;

    /** Linear weight (kg/m) */
    weight: number;

    /** Weight of surrounding/attached cables (kg/m) */
    carrierWeight: number;

    /** Usual maximum allowable stress (kg/mm²) */
    normalTraction: number;

    /** Breaking stress (kg/mm²) */
    breakingStress: number;

    /** Thermal expansion coefficient (°C⁻¹) */
    expansionCoefficient: number;

    /** Young's modulus (kg/mm²) */
    elasticityModulus: number;

    /** Specific weight (kg/mm²/m) */
    specificWeight: number;

    /** Maximum constraint (kg/mm²) – optional */
    maxConstraint: number;

    /** Alternate cable type names for shape-file matching */
    shapeFileCableTypes: string[];

    constructor(json: Record<string, unknown>) {
        this.type                = (json['Type'] as string) ?? '';
        this.sectionArea         = (json['SectionArea'] as number) ?? 0;
        this.numberOfWire        = (json['NumberOfWire'] as number) ?? 1;
        this.diameter            = (json['Diameter'] as number) ?? 0;
        this.weight              = (json['Weight'] as number) ?? 0;
        this.carrierWeight       = (json['CarrierWeight'] as number) ?? 0;
        this.normalTraction      = (json['NormalTraction'] as number) ?? 0;
        this.breakingStress      = (json['BreakingStress'] as number) ?? 0;
        this.expansionCoefficient = (json['ExpansionCoefficient'] as number) ?? 0;
        this.elasticityModulus   = (json['ElasticityModulus'] as number) ?? 0;
        this.specificWeight      = (json['SpecificWeight'] as number) ?? 0;
        this.maxConstraint       = (json['MaxConstraint'] as number) ?? 0;
        this.shapeFileCableTypes = (json['ShapeFileCableTypes'] as string[]) ?? [];
    }
}

// ── SecurityCoefficients (sub-object of PoleType) ────────────────────────────

export interface SecurityCoefficients {
    middle: number;
}

// ── PoleType ─────────────────────────────────────────────────────────────────

export class PoleType {
    /** Short key identifier (e.g. "S", "D", "B") */
    key: string;

    /** Human-readable label */
    value: string;

    /** Symmetry indicator (0 = none, 1 = single, 2 = double) */
    symmetric: number;

    /** AutoCAD block name */
    blockName: string;

    /** Alternate names used for import matching */
    typeAliases: string[];

    /** Optional security coefficients */
    securityCoefficients: number;

    constructor(json: Record<string, unknown>) {
        this.key          = (json['Key'] as string) ?? '';
        this.value        = (json['Value'] as string) ?? '';
        this.symmetric    = (json['Symmetric'] as number) ?? 0;
        this.blockName    = (json['BlockName'] as string) ?? '';
        this.typeAliases  = (json['TypeAliases'] as string[]) ?? [];
        this.securityCoefficients = (json['securityCoefficients'] as number) ?? 1.9;
    }
}

// ── AppSettings (root) ──────────────────────────────────────────────────────

export class AppSettings {
    poleTypes: PoleType[];
    cables: Cable[];

    constructor(json: Record<string, unknown>) {
        this.poleTypes = ((json['PoleTypes'] as Record<string, unknown>[]) ?? [])
            .map(p => new PoleType(p));
        this.cables = ((json['Cables'] as Record<string, unknown>[]) ?? [])
            .map(m => new Cable(m));
    }

    /** Find a cable by type */
    getCable(type: string): Cable | undefined {
        return this.cables.find(m => m.type === type);
    }

    /** Find a pole type by key */
    getPoleType(key: string): PoleType | undefined {
        return this.poleTypes.find(p => p.key === key);
    }
}

// ── Singleton instance loaded from the bundled JSON ─────────────────────────

export const appSettings = new AppSettings(appSettingsJson as unknown as Record<string, unknown>);
