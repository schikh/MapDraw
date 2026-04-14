import { Line } from './Line';
import { Pole } from './Pole';
import { Position } from './Position';
import { Canton } from './Canton';

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
    expect(Math.round(constraint * 1000) / 1000).toBe(2.873);
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
    expect(Math.round(constraint * 1000) / 1000).toBe(3.304);
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
    expect(Math.round(constraint * 1000) / 1000).toBe(2.682);
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
    expect(Math.round(constraint * 1000) / 1000).toBe(2.903);
    console.log('constraint', round(constraint));
  });

});

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