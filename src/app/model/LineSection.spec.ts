import { Line } from './Line';
import { Pole } from './Pole';
import { Position } from './Position';
import { Canton } from './Canton';
import { Project } from './Project';
import { settings } from '../config/Settings';

describe('lineSection hanging height factors', () => {
  it('getStartPoleHangingHeightFactor', () => {
    // Arrange
    const canton = createCanton(164);
    // Act
    const startFactor = canton.lines[0].lineSections[0].getStartPoleHangingHeightFactor();
    // Assert
    const res = 10 / (10 - 0.2);
    expect(startFactor).toBeCloseTo(res); 
  });

  it('getEndPoleHangingHeightFactor()', () => {
    // Arrange
    const canton = createCanton(164);
    // Act
    const endFactor = canton.lines[0].lineSections[0].getEndPoleHangingHeightFactor();
    // Assert
    const res = 10 / (10 - 0.2);
    expect(endFactor).toBeCloseTo(res);   
  });
});

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
    expect(constraint).toBeCloseTo(2.873);
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
    expect(constraint).toBeCloseTo(3.304);
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
    expect(constraint).toBeCloseTo(2.682);
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
    expect(constraint).toBeCloseTo(2.903);
  });
});

describe('canton.CalcSectionMechanicalConstraint', () => {
  it('calcSectionsMechanicalConstraint', () => {
    // Arrange
    const canton = createCanton(164);
    canton.lines[0].maxConstraint = 10;
    // Act
    const startVector = canton.lines[0].lineSections[0].getMechanicalConstraintStartVector();
    const endVector = canton.lines[0].lineSections[0].getMechanicalConstraintEndVector();
    // Assert
    const res = 10 / (10 - 0.2) * 10;
    expect(startVector.intensity).toBeCloseTo(res);
    expect(startVector.angle).toBeCloseTo(0);
    expect(endVector.intensity).toBeCloseTo(res);   
    expect(endVector.angle).toBeCloseTo(Math.PI);
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
    project.calcWindConstraint();
    // Assert
    const factor = canton.lines[0].lineSections[0].getStartPoleHangingHeightFactor();
    const windConstraint = settings.DragCoefficient * length * Q * canton.lines[0].cable.diameter / 1000 / 2 / factor;
    expect(canton.poles[0].windConstraint.intensity).toBeCloseTo(windConstraint);
    expect(canton.poles[0].windConstraint.angle * 180 / Math.PI).toBeCloseTo(90);
    expect(canton.poles[1].windConstraint.intensity).toBeCloseTo(windConstraint);
    expect(canton.poles[1].windConstraint.angle * 180 / Math.PI).toBeCloseTo(90);
  });
});

describe('project.calcPoleMechanicalConstraint3polesWind', () => { 
  it('calcPoleMechanicalConstraint', () => {
    // Arrange
    // Third pole on top of the second one at a 100m distance and the first one it to its right at 100m on the x axis
    const project = createProject(3, 0, 100); 
    const canton = project.cantons[0];
    const lengthLine1 = canton.sections[0].length;
    const lengthLine2 = canton.sections[1].length;
    const Q = 75.006;
    // Act
    project.calcWindConstraint();
    //Assert
    const factor = canton.lines[0].lineSections[0].getStartPoleHangingHeightFactor();
    const maxWindConstraintLineSection1 = settings.DragCoefficient * lengthLine1 * Q * canton.lines[0].cable.diameter / 1000 / 2 / factor;
    const maxWindConstraintLineSection2 = settings.DragCoefficient * lengthLine2 * Q * canton.lines[0].cable.diameter / 1000 / 2 / factor;
    const windConstraint = maxWindConstraintLineSection1 * Math.sin(Math.PI / 4);
    expect(canton.poles[0].windConstraint.intensity).toBeCloseTo(maxWindConstraintLineSection1);
    expect(canton.poles[0].windConstraint.angle * 180 / Math.PI).toBeCloseTo(90);
    expect(canton.poles[1].windConstraint.intensity).toBeCloseTo(2 * windConstraint);
    expect(canton.poles[1].windConstraint.angle * 180 / Math.PI).toBeCloseTo(45);
    expect(canton.poles[2].windConstraint.intensity).toBeCloseTo(maxWindConstraintLineSection2);
    expect(canton.poles[2].windConstraint.angle * 180 / Math.PI).toBeCloseTo(0);
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
  const pole2 = new Pole(2, 500, 12, 45, 10, new Position(0, 0, 0));
  canton.addPole(pole1);
  canton.addPole(pole2);
  if (nbr >= 3) {
    const pole3 = new Pole(3, 500, 12, 45, 10, new Position(x, y, 0));
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