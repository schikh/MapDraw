import { Vector } from './Vector';

export class Constraint {
    public mechanicalConstraint: Vector = new Vector();
    public replacementPoleMechanicalConstraint: Vector = new Vector();
    public cantonId: number = 0;
}
