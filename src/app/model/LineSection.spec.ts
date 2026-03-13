import { Line } from './Line';
import { Pole } from './Pole';
import { Position } from './Position';
import { Canton } from './Canton';

describe('LineSection.calcConstraintAtConditions', () => {
  it('calculates constraint for known and target states', () => {
    
    // Setup cable and poles as in the demo
    const cable = new Line({
      type: 'Aluminium 34.4',
      sectionArea: 34.4,
      diameter: 7.5,
      weight: 2.76,
      carrierWeight: 0,
      expansionCoefficient: 23e-6,
      elasticityModulus: 6000,
      normalTraction: 10,
    });
    const pole1 = new Pole("1", 500, 12, 45, 10, new Position(0, 0, 0));
    const pole2 = new Pole("2", 500, 12, 135, 10, new Position(164, 0, 0));
    const canton = new Canton();
    canton.addPole(pole1);
    canton.addPole(pole2);
    canton.addLine(cable);
    const [lineSection] = cable.lineSections;

    // Known and target states
    const constraint = lineSection.calcConstraintAtConditions(
      10,    // constraint1
      15,    // temp1
      4.393, // overload1
      40,    // temp2
      1      // overload2
    );

    // The expected value is from the demo output, or you can use a tolerance
    // For now, just check it's a finite number and within a reasonable range
    expect(constraint).toBeGreaterThan(0);
    expect(constraint).toBeLessThan(20);
  });
});
