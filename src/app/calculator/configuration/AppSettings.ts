export interface Material {
    name: string;
    cables: Cable[];
}

export interface Cable {
    type: string;
    sectionArea: number;
    diameter: number;
    weight: number;
    carrierWeight: number;
    normalTraction: number;
    expansionCoefficient: number;
    elasticityModulus: number;
    specificWeight: number;
    shapeFileCableTypes?: string[];
    minConstraint: number;
    maxConstraint: number;
}

export interface PoleType {
    key: string;
    value: string;
    symmetric: number;
    blockName: string;
    typeAliases?: string[];
    securityCoefficients: SecurityCoefficients;
}

export interface SecurityCoefficients {
    middle: number;
}

export interface PtaPole {
    id: number;
    name: string;
    type: string;
    height: number;
    strength: number;
}

export interface CalculationParameters {
    displayTemperature: number;
    extremeSummerTemperature: number;
    summerTemperature: number;
    summerCoefficientHigh: number;
    summerCoefficientLow: number;
    winterTemperature: number;
    winterCoefficient: number;
    windSpeed: number;
    dragCoefficient: number;
    gravitationalForce: number;
    airSpecificWeight: number;
    minLineHeight: number;
    minLineHeightCrossingStreet: number;
}

export interface ReplacementPoleParameters {
    strengths: number[];
    minHeadStrength: number;
    minHeadHeight: number;
    securityCoefficients: number;
}

export interface PoleParameters {
    poleHeights: number[];
    poleStrengths: number[];
    showPoleConstraintRatio: boolean;
    defaultPoleBlockName: string;
    poleBlockPath: string;
    piccPoleNames: string[];
    maxConstraintsLayerName: string;
    lineAnglesLayerName: string;
    poleNonOresLayerName: string;
    poleWithNoInformationLayerName: string;
    poleWithNoCantonLayerName: string;
    poleToIgnoreLayerName: string;
    poleToReplaceLayerName: string;
    poleDonutLayerName: string;
    poleLayerName: string;
    poleNonOresDescriptionsLayerName: string;
    poleWithNoCantonDescriptionsLayerName: string;
    poleToIgnoreDescriptionsLayerName: string;
    poleToReplaceDescriptionsLayerName: string;
    poleDescriptionsLayerName: string;
}

export interface Parameters {
    cantonLayerName: string;
    sectionDescriptionsLayerName: string;
    sectionWithNewLineDescriptionsLayerName: string;
    sectionSagLayerName: string;
    opticalFiberLinesLayerName: string;
    tableLayerName: string;
    topoLayers: string[];
    standardActivityReportStrings: string[][];
    activityReportMessage: string;
    owners: string[];
}

export interface Layout {
    cellWidth: number;
    cellHeight: number;
    lastCellWidth: number;
    polePositionX: number;
    poleWidth: number;
    poleBaseHeight: number;
    cablePositionY: number;
    gap: number;
}

export class AppSettings {
    private static _instance: AppSettings | null = null;

    public poleTypes: PoleType[] = [];
    public ptaPoles: PtaPole[] = [];
    public materials: Material[] = [];
    public parameters: Parameters = {
        cantonLayerName: "BT-Canton {id}",
        sectionDescriptionsLayerName: "BT-Portées-Caractéristiques",
        sectionWithNewLineDescriptionsLayerName: "BT-Portées-à-tirer-Caractéristiques",
        sectionSagLayerName: "BT-Flèches",
        opticalFiberLinesLayerName: "BT-Fibres optiques",
        tableLayerName: "BT-Tableau de pose",
        topoLayers: ["W0001", "VOIRIE_AXE - Communale"],
        standardActivityReportStrings: [],
        activityReportMessage: "",
        owners: ["ORES", "Autre"]
    };
    public layout: Layout = {
        cellWidth: 160,
        cellHeight: 60,
        lastCellWidth: 100,
        polePositionX: 10,
        poleWidth: 10,
        poleBaseHeight: 80,
        cablePositionY: 40,
        gap: 20
    };
    public poleParameters: PoleParameters = {
        poleHeights: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        poleStrengths: [100, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1250, 1500, 2000, 2500, 3000],
        showPoleConstraintRatio: true,
        defaultPoleBlockName: "PoteauBtS",
        poleBlockPath: "",
        piccPoleNames: ["T473", "T471", "T1471", "Poteau"],
        maxConstraintsLayerName: "BT-Résultantes",
        lineAnglesLayerName: "BT-Piquetage",
        poleNonOresLayerName: "BT-Poteaux-autres",
        poleWithNoInformationLayerName: "BT-Poteaux-sans-information",
        poleWithNoCantonLayerName: "BT-Poteaux-sans-canton",
        poleToIgnoreLayerName: "BT-Poteaux-à-ignorer",
        poleToReplaceLayerName: "BT-Poteaux-à-remplacer",
        poleDonutLayerName: "BT-Poteaux-à-remplacer-Cercle",
        poleLayerName: "BT-Poteaux-avec-canton",
        poleNonOresDescriptionsLayerName: "BT-Poteaux-autres-Caractéristiques",
        poleWithNoCantonDescriptionsLayerName: "BT-Poteaux-sans-canton-Caractéristiques",
        poleToIgnoreDescriptionsLayerName: "BT-Poteaux-à-ignorer-Caractéristiques",
        poleToReplaceDescriptionsLayerName: "BT-Poteaux-à-remplacer-Caractéristiques",
        poleDescriptionsLayerName: "BT-Poteaux-avec-canton-Caractéristiques"
    };
    public replacementPoleParameters: ReplacementPoleParameters = {
        strengths: [400, 600, 800, 1000, 1500],
        minHeadStrength: 800,
        minHeadHeight: 11,
        securityCoefficients: 1.4
    };
    public calculationParameters: CalculationParameters = {
        displayTemperature: 15,
        extremeSummerTemperature: 40,
        summerTemperature: 15,
        summerCoefficientHigh: 0.7,
        summerCoefficientLow: 0.5,
        winterTemperature: -15,
        winterCoefficient: 0.25,
        windSpeed: 34.66,
        dragCoefficient: 1.45,
        gravitationalForce: 9.81,
        airSpecificWeight: 1.225,
        minLineHeight: 6,
        minLineHeightCrossingStreet: 7
    };

    public getPoleType(type: string): string {
        const pole = this.poleTypes.find(p => 
            p.value?.toLowerCase() === type?.toLowerCase() ||
            p.typeAliases?.some(a => a?.toLowerCase() === type?.toLowerCase())
        );
        return pole?.key ?? "I";
    }

    public getPoleBlockNames(): string[] {
        return this.poleTypes.map(t => t.blockName);
    }

    public getCableType(type: string): { material: Material | null; cable: Cable | null } {
        for (const material of this.materials) {
            for (const cable of material.cables) {
                if (cable.type.toLowerCase() === type.toLowerCase()) {
                    return { material, cable };
                }
                if (cable.shapeFileCableTypes?.some(t => t.toLowerCase() === type.toLowerCase())) {
                    return { material, cable };
                }
            }
        }
        return { material: null, cable: null };
    }
}
