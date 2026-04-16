import { Line } from './Line';
import { Pole } from './Pole';
import { Position } from './Position';
import { Canton } from './Canton';
import { Project } from './Project';

// describe('LineSection.calcConstraintAtConditions', () => {
//   it('calculates constraint for line > 125m ==> 15C', () => {
//     // Arrange
//     const canton = createCanton(164);
//     const section = canton.sections[0];
//     const lineSection = section.lineSections[0];
//     // Act
//     const constraint = lineSection.calcConstraintAtConditions(
//       10,    // constraint1
//       15,    // temp1
//       4.393, // overload1
//       40,    // temp2
//       1      // overload2
//     );
//     // Assert
//     expect(round(constraint)).toBe(2.873);
//     console.log('constraint', round(constraint));
//   });

//   it('calculates constraint for 100m > line > 125m ==> -15C', () => {
//     // Arrange
//     const canton = createCanton(114);
//     const section = canton.sections[0];
//     const lineSection = section.lineSections[0];
//     // Act
//     const constraint = lineSection.calcConstraintAtConditions(
//       10,    // constraint1
//       -15,    // temp1
//       2.356, // overload1
//       40,    // temp2
//       1      // overload2
//     );
//     // Assert
//     expect(round(constraint)).toBe(3.304);
//     console.log('constraint', round(constraint));
//   });

//   it('calculates constraint for 83m > line > 100m ==> 15C', () => {
//     // Arrange
//     const canton = createCanton(94);
//     const section = canton.sections[0];
//     const lineSection = section.lineSections[0];
//     // Act
//     const constraint = lineSection.calcConstraintAtConditions(
//       10,    // constraint1
//       15,    // temp1
//       6.074, // overload1
//       40,    // temp2
//       1      // overload2
//     );
//     // Assert
//     expect(round(constraint)).toBe(2.682);
//     console.log('constraint', round(constraint));
//   });

//   it('calculates constraint for line < 83m ==> -15C', () => {
//     // Arrange
//     const canton = createCanton(64);
//     const section = canton.sections[0];
//     const lineSection = section.lineSections[0];
//     // Act
//     const constraint = lineSection.calcConstraintAtConditions(
//       10,    // constraint1
//       -15,    // temp1
//       2.356, // overload1
//       40,    // temp2
//       1      // overload2
//     );
//     // Assert
//     expect(round(constraint)).toBe(2.903);
//     console.log('constraint', round(constraint));
//   });
// });

// describe('canton.CalcSectionMechanicalConstraint', () => {
//   it('calcSectionsMechanicalConstraint', () => {
//     // Arrange
//     const canton = createCanton(164);
//     canton.lines[0].maxConstraint = 10;
//     // Act
//     canton.calcSectionsMecanicalConstraint();
//     // Assert
//     const lineSection = canton.sections[0].lineSections[0];
//     const res = round(10 / (10 - 0.2) * 10);
//     expect(round(lineSection.mecanicalConstraintStart)).toBe(res);
//     expect(round(lineSection.mecanicalConstraintEnd)).toBe(res);
//     console.log(round(lineSection.mecanicalConstraintStart));
//     console.log(round(lineSection.mecanicalConstraintEnd));    
//   });
// });

describe('project.calcPoleMechanicalConstraint', () => { 
  it('calcPoleMechanicalConstraint', () => { 
    // Arrange
    // Third pole on top of the second one at a 100m distance and the first one it to its right at 100m on the x axis
    const project = createProject(0, 100); 
    const canton = project.cantons[0];
    canton.lines[0].maxConstraint = 10;
    canton.calcSectionsMecanicalConstraint();
    // Act
    project.calcPoleMechanicalConstraint();
    //Assert
    const m1 = project.poles[0].mechanicalConstraint;
    const m2 = project.poles[1].mechanicalConstraint;
    const m3 = project.poles[2].mechanicalConstraint;
    expect(m1.x).toBeCloseTo(-10.204);
    expect(m1.y).toBeCloseTo(0);
    expect(m2.x).toBeCloseTo(10.204);
    expect(m2.y).toBeCloseTo(10.204);
    expect(m3.x).toBeCloseTo(0);
    expect(m3.y).toBeCloseTo(-10.204);
  });
});

// function createCanton(dist: number): Canton {
//   const cable = new Line('ALU 34.4');
//   const pole1 = new Pole(1, 500, 12, 45, 10, new Position(0, 0, 0));
//   const pole2 = new Pole(2, 500, 12, 135, 10, new Position(dist, 0, 0));
//   const canton = new Canton(1);
//   canton.addPole(pole1);
//   canton.addPole(pole2);
//   canton.addLine(cable);
//   return canton;
// }

// function round(num: number, dec: number = 3): number {
//   return Math.round(num * 10 ** dec) / 10 ** dec;
// }

function createProject(x: number, y: number): Project {
  const canton = createCan(x, y);
  const poles = [canton.poles[0], canton.poles[1], canton.poles[2]];
  const cantons = [canton];
  return new Project(poles, cantons);
}

function createCan (x: number, y: number): Canton {
  const cable = new Line('ALU 34.4');
  const pole1 = new Pole(1, 500, 12, 45, 10, new Position(100, 0, 0));
  const pole2 = new Pole(1, 500, 12, 45, 10, new Position(0, 0, 0));
  const pole3 = new Pole(1, 500, 12, 45, 10, new Position(x, y, 0));
  const canton = new Canton(1);
  canton.addPole(pole1);
  canton.addPole(pole2);
  canton.addPole(pole3);
  canton.addLine(cable);
  return canton;
}