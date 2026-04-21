import { Line } from './Line';
import { Pole } from './Pole';
import { Position } from './Position';
import { Canton } from './Canton';
import { Project } from './Project';
import { settings } from '../config/Settings';

describe('LineSection.calcConstraintAtConditions', () => {
  it('calculates constraint for line > 125m ==> 15C', () => {
    // Arrange
    const canton = createCanton(164);
    const section = canton.sections[0];
    const lineSection = section.lineSections[0];
    // Act
    const constraint = lineSection.calcConstraintAtConditions(
      10,    // constraint1
      15,    // temp1
      4.393, // overload1
      40,    // temp2
      1      // overload2
    );
    // Assert
    expect(round(constraint)).toBe(2.873);
    console.log('constraint', round(constraint));
  });

  it('calculates constraint for 100m > line > 125m ==> -15C', () => {
    // Arrange
    const canton = createCanton(114);
    const section = canton.sections[0];
    const lineSection = section.lineSections[0];
    // Act
    const constraint = lineSection.calcConstraintAtConditions(
      10,    // constraint1
      -15,    // temp1
      2.356, // overload1
      40,    // temp2
      1      // overload2
    );
    // Assert
    expect(round(constraint)).toBe(3.304);
    console.log('constraint', round(constraint));
  });

  it('calculates constraint for 83m > line > 100m ==> 15C', () => {
    // Arrange
    const canton = createCanton(94);
    const section = canton.sections[0];
    const lineSection = section.lineSections[0];
    // Act
    const constraint = lineSection.calcConstraintAtConditions(
      10,    // constraint1
      15,    // temp1
      6.074, // overload1
      40,    // temp2
      1      // overload2
    );
    // Assert
    expect(round(constraint)).toBe(2.682);
    console.log('constraint', round(constraint));
  });

  it('calculates constraint for line < 83m ==> -15C', () => {
    // Arrange
    const canton = createCanton(64);
    const section = canton.sections[0];
    const lineSection = section.lineSections[0];
    // Act
    const constraint = lineSection.calcConstraintAtConditions(
      10,    // constraint1
      -15,    // temp1
      2.356, // overload1
      40,    // temp2
      1      // overload2
    );
    // Assert
    expect(round(constraint)).toBe(2.903);
    console.log('constraint', round(constraint));
  });
});

describe('canton.CalcSectionMechanicalConstraint', () => {
  it('calcSectionsMechanicalConstraint', () => {
    // Arrange
    const canton = createCanton(164);
    canton.lines[0].maxConstraint = 10;
    // Act
    canton.calcSectionsMecanicalConstraint();
    // Assert
    const lineSection = canton.sections[0].lineSections[0];
    const res = round(10 / (10 - 0.2) * 10);
    expect(round(lineSection.mecanicalConstraintStart)).toBe(res);
    expect(round(lineSection.mecanicalConstraintEnd)).toBe(res);
    console.log(round(lineSection.mecanicalConstraintStart));
    console.log(round(lineSection.mecanicalConstraintEnd));    
  });
});

describe('project.calcPoleMechanicalConstraint2polesWind', () => { 
  it('calcPoleMechanicalConstraint', () => { 
    // Arrange
    const project = createProject(2, 0, 0); 
    const canton = project.cantons[0];
    const length = canton.sections[0].length;
    const Q = 75.006;
    // Act
    project.calcWindForce();
    // Assert
    const coef = project.poles[0].aboveGroundHeight / (project.poles[0].aboveGroundHeight - canton.lines[0].hangingHeight);
    const windConstraint = coef * settings.DragCoefficient * length * Q * canton.lines[0].cable.diameter / 1000 / 2;
    expect(canton.poles[1].windConstraint.intensity).toBeCloseTo(windConstraint);
    expect(canton.poles[1].windConstraint.angle * 180 / Math.PI).toBeCloseTo(90);
  });
});

describe('project.calcPoleMechanicalConstraint3poles', () => { 
  it('calcPoleMechanicalConstraint', () => { 
    // Arrange
    // Third pole on top of the second one at a 100m distance and the first one it to its right at 100m on the x axis
    const project = createProject(3, 0, 100); 
    const canton = project.cantons[0];
    const length = canton.sections[0].length;
    const dragCoef = settings.DragCoefficient;
    const diameter = canton.lines[0].cable.diameter / 1000;
    const Q = 75.006;
    // Act
    project.calcWindForce();
    //Assert
    const coefLine1 = project.poles[0].aboveGroundHeight / (project.poles[0].aboveGroundHeight - canton.lines[0].hangingHeight);
    const coefLine2 = project.poles[1].aboveGroundHeight / (project.poles[1].aboveGroundHeight - canton.lines[0].hangingHeight);
    const windConstraintEndPole2 = coefLine1 * dragCoef * length * Q * diameter / 2;
    const windConstraintStartPole2 = coefLine2 * dragCoef * length * Q * diameter / 2;
    const ang = (canton.poles[0].windConstraint.add(canton.poles[1].windConstraint)).angle;
    expect(canton.poles[1].windConstraint.intensity).toBeCloseTo(windConstraintEndPole2 + windConstraintStartPole2);
    expect(ang * 180 / Math.PI).toBeCloseTo(Math.PI / 4 * 180 / Math.PI);
  });
});

function createProject(num: number, x: number, y: number): Project {
  const canton = createCan(num, x, y);
  const cantons = [canton];
  return new Project(canton.poles, cantons);
}

function createCan(nbr: number, x: number, y: number): Canton {
  const cable = new Line('ALU 34.4');
  const canton = new Canton(1);
  const pole1 = new Pole(1, 500, 12, 45, 10, new Position(100, 0, 0));
  const pole2 = new Pole(1, 500, 12, 45, 10, new Position(0, 0, 0));
  canton.addPole(pole1);
  canton.addPole(pole2);
  if (nbr >= 3) {
    const pole3 = new Pole(1, 500, 12, 45, 10, new Position(x, y, 0));
    canton.addPole(pole3);
  }
  canton.addLine(cable);
  return canton;
}

function createCanton(dist: number): Canton {
  const cable = new Line('ALU 34.4');
  const pole1 = new Pole(1, 500, 12, 45, 10, new Position(0, 0, 0));
  const pole2 = new Pole(2, 500, 12, 135, 10, new Position(dist, 0, 0));
  const canton = new Canton(1);
  canton.addPole(pole1);
  canton.addPole(pole2);
  canton.addLine(cable);
  return canton;
}

function round(num: number, dec: number = 3): number {
  return Math.round(num * 10 ** dec) / 10 ** dec;
}