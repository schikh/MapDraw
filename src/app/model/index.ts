// export { Canton } from './Canton';
// export { Line } from './Line';
// export { LineSection } from './LineSection';
// export { Pole } from './Pole';
// export { Position } from './Position';
// export { Project } from './Project';

// // ──────────────────────────────────────────────
// //  Demo / verification of constraint calculation
// // ──────────────────────────────────────────────

// // Cable characteristics (from specification)
// const cable = new Line({
//     type: "Aluminium 34.4",
//     sectionArea: 34.4,            // mm²
//     diameter: 7.5,                // mm  (typical for 34.4 mm² Al)
//     weight: 2.76,                 // kg/mm²/km  →  specificWeight = 0.00276 kg/mm²/m
//     carrierWeight: 0,             // kg/m  (no surrounding cables for this example)
//     expansionCoefficient: 23e-6,  // °C⁻¹
//     elasticityModulus: 6000,      // kg/mm²  (= 6·10³)
//     normalTraction: 10,           // kg/mm²  (usual max constraint)
// });

// // Two poles forming a single span — distance computed from positions
// const pole1 = new Pole("1", 500, 12, 10, 45, new Position(0, 0, 0));
// const pole2 = new Pole("2", 500, 12, 10, 135, new Position(164, 0, 0));

// // Build the canton
// const canton = new Canton();
// canton.addPole(pole1);
// canton.addPole(pole2); // length auto-computed from (x,y,z)

// // Add the cable → creates one LineSection
// canton.addLine(cable);

// const [lineSection] = cable.lineSections;

// // ──────────────────────────────────────────────
// //  Calculate constraint at new conditions
// //
// //  Known state:  σ₁ = 10 kg/mm²  at  θ₁ = 40°C,  m₁ = 1
// //  Target state: θ₂ = 15°C,  m₂ = 1
// // ──────────────────────────────────────────────
// // Known state:  σ₁ = 10 kg/mm²  at  θ₁ = 40°C,  m₁ = 4.393
// // Target state: θ₂ = 15°C,  m₂ = 1
// const constraint2 = lineSection.calcConstraintAtConditions(
//     10,     // constraint1 — known tension (kg/mm²)
//     15,     // temp1       — temperature at known state (°C)
//     4.393,  // overload1   — overload at known state sqrt(m summer low)
//     40,     // temp2       — target temperature (°C)
//     1,      // overload2   — overload at target state
// );

// console.log("═══════════════════════════════════════════════════");
// console.log("  Cable Constraint Calculation — Change of State");
// console.log("═══════════════════════════════════════════════════");
// console.log(`  Cable type        : ${cable.type}`);
// console.log(`  Section area      : ${cable.sectionArea} mm²`);
// console.log(`  Specific weight   : ${cable.specificWeight} kg/mm²/m`);
// console.log(`  Elasticity modulus: ${cable.elasticityModulus} kg/mm²`);
// console.log(`  Expansion coeff   : ${cable.expansionCoefficient} °C⁻¹`);
// console.log(`  Span length       : ${lineSection.section.length} m`);
// console.log("───────────────────────────────────────────────────");
// console.log(`  Known state       : σ₁ = 10 kg/mm²  at 40°C, overload = 4.393`);
// console.log(`  Target state      :                  at 15°C, overload = 1`);
// console.log("───────────────────────────────────────────────────");
// console.log(`  ➜ Constraint at 15°C = ${constraint2.toFixed(4)} kg/mm²`);
// console.log("═══════════════════════════════════════════════════");
