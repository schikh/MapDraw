import { Vector } from "./Vector";

describe('LineSection.calcConstraintAtConditions', () => {
  it('calculates constraint for line > 125m ==> 15C', () => {
    // Arrange
    const v1 = new Vector(10, 20);
    const v2 = new Vector(-15, 30);
    // Act
    const v3 = v1.add(v2);
    // Assert
    expect(v3.x).toBe(-5);
    expect(v3.y).toBe(50);
  });
});

//describe('Calculator.getWindForcePerMeter')
