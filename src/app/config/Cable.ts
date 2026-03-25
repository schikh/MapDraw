// export class Cable {
//     /** Cable type identifier */
//     public type: string;

//     /** Cross-section area (mm²) */
//     public sectionArea: number;

//     /** Cable diameter (mm) */
//     public diameter: number;

//     /** Linear weight of the cable (kg/mm²/km) */
//     public weight: number;

//     /** Weight of surrounding/attached cables (kg/m) */
//     public carrierWeight: number;

//     /** Thermal expansion coefficient (°C⁻¹) */
//     public expansionCoefficient: number;

//     /** Young's modulus (kg/mm²) */
//     public elasticityModulus: number;

//     /**
//      * Specific weight derived from weight.
//      * Converted from kg/mm²/km to kg/mm²/m  (= weight / 1000).
//      */
//     public specificWeight: number;

//     /** Usual maximum allowable stress (kg/mm²) */
//     public normalTraction: number;

//     public createdAt: string;

//     public maxConstraint: number = 0;

//     constructor(params: {
//         type: string;
//         sectionArea: number;
//         diameter: number;
//         weight: number;
//         carrierWeight: number;
//         expansionCoefficient: number;
//         elasticityModulus: number;
//         normalTraction: number;
//         specificWeight: number;
//     }) {
//         this.type = params.type;
//         this.sectionArea = params.sectionArea;
//         this.diameter = params.diameter;
//         this.weight = params.weight;
//         this.createdAt = new Date().toISOString();
//         this.carrierWeight = params.carrierWeight;
//         this.expansionCoefficient = params.expansionCoefficient;
//         this.elasticityModulus = params.elasticityModulus;
//         this.normalTraction = params.normalTraction;
//         this.specificWeight = params.specificWeight;
//     }
// }

//   // /** Default constructor parameters keyed by cable type */
//   // export const cables: Record<string, ConstructorParameters<typeof Cable>[0]> = {
//   //   'Type-A': {
//   //     type: 'Type-A',
//   //     sectionArea: 34.4,
//   //     diameter: 7.5,
//   //     weight: 2.76,
//   //     carrierWeight: 0,
//   //     expansionCoefficient: 23e-6,
//   //     elasticityModulus: 6000,
//   //     normalTraction: 10,
//   //   },
//   //   'Type-B': {
//   //     type: 'Type-B',
//   //     sectionArea: 54.6,
//   //     diameter: 9.45,
//   //     weight: 4.39,
//   //     carrierWeight: 0,
//   //     expansionCoefficient: 23e-6,
//   //     elasticityModulus: 6000,
//   //     normalTraction: 12,
//   //   },
//   //   'Type-C': {
//   //     type: 'Type-C',
//   //     sectionArea: 75.5,
//   //     diameter: 11.25,
//   //     weight: 6.07,
//   //     carrierWeight: 0,
//   //     expansionCoefficient: 23e-6,
//   //     elasticityModulus: 6000,
//   //     normalTraction: 14,
//   //   },
//   // };
