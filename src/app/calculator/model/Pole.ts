import { AppSettings, PoleType } from '../configuration/AppSettings';
import { Calculator } from './Calculator';
import { Canton } from './Canton';
import { Constraint } from './Constraint';
import { Position } from './Position';
import { ReplacementPole } from './ReplacementPole';
import { Vector } from './Vector';
import { toRadian, toDegree, roundAngle } from '../extensions/NumericExtensions';

export class Pole {
    private _rotation: number = 0;

    public id: number = 0;
    public type: string = "S";
    public height: number = 10;
    public strength: number = 400;
    public aboveGroundHeight: number = 8.4;
    public forcedHeight: number = 0;
    public forcedStrength: number = 0;
    public position: Position = new Position();
    public inGoodState: boolean = true;
    public reference: string = "";
    public externalReference: string = "";
    public vegetation: boolean = false;
    public year: string = "";
    public platePicture: string = "";
    public headPicture: string = "";
    public overallPicture: string = "";
    public lightPole: boolean = false;
    public aerialConnections: number = 0;
    public undergroundConnections: number = 0;
    public telcoFeatureId: string = "";
    public ignore: boolean = false;
    public diameter: number = 170;
    public sigma: number = 34;
    public owner: string = "ORES";
    public mustBeReplaced: boolean = false;
    public isNew: boolean = false;
    public isPta: boolean = false;
    public ptaPoleId: number | null = null;
    public hasCanton: boolean = false;
    public isNotConfigured: boolean = false;
    public isReferenceMissing: boolean = false;
    public isHeadPole: boolean = false;

    public constraints: Constraint[] = [];
    public replacementPole: ReplacementPole | null = null;
    public forcedReplacementPole: ReplacementPole | null = null;

    public totalConstraint: Vector = new Vector();
    public totalConstraintToPoleAngle: number = 0;
    public strengthByTotalConstraintAngle: number = 0;
    public constraintRatio: number = 0;
    public windConstraint: Vector = new Vector();
    public totalMechanicalConstraint: Vector = new Vector();

    public replacementPoleTotalConstraint: Vector = new Vector();
    public replacementPoleTotalConstraintToPoleAngle: number = 0;
    public replacementPoleStrengthByTotalConstraintAngle: number = 0;
    public replacementPoleConstraintRatio: number = 0;
    public replacementPoleWindConstraint: Vector = new Vector();
    public replacementPoleTotalMechanicalConstraint: Vector = new Vector();

    public get rotation(): number {
        return this.type === "B" ? 0 : this._rotation;
    }

    public set rotation(value: number) {
        this._rotation = value;
    }

    public get tag(): string {
        return `PT-${this.id.toString().padStart(4, '0')}`;
    }

    public get isForced(): boolean {
        return this.forcedReplacementPole !== null;
    }

    public get isReplaced(): boolean {
        return this.replacementPole !== null;
    }

    public get isForcedOrReplaced(): boolean {
        return this.isForced || this.isReplaced;
    }

    public get valid(): boolean {
        return this.type !== "I" && this.height >= 5 && this.strength >= 100 && 
               this.aboveGroundHeight >= 5 && this.position.x > 0 && this.position.y > 0;
    }

    public get poleType(): PoleType | undefined {
        return AppSettings.instance.poleTypes.find(m => m.key === this.type);
    }

    public get securityCoefficient(): number {
        return this.poleType?.securityCoefficients.middle ?? 1.9;
    }

    public get isOresPole(): boolean {
        return this.owner === "ORES";
    }

    public get isReplacementPoleCritical(): boolean {
        return this.replacementPoleConstraintRatio > AppSettings.instance.replacementPoleParameters.securityCoefficients;
    }

    public getReplacementPole(): ReplacementPole | null {
        if (this.isForced) return this.forcedReplacementPole;
        if (this.isReplaced) return this.replacementPole;
        throw new Error("Pole is not forced or replaced");
    }

    public getOrCreateConstraint(cantonId: number): Constraint {
        let constraint = this.constraints.find(c => c.cantonId === cantonId);
        if (!constraint) {
            constraint = new Constraint();
            constraint.cantonId = cantonId;
            constraint.mechanicalConstraint = new Vector();
            constraint.replacementPoleMechanicalConstraint = new Vector();
            this.constraints.push(constraint);
        }
        return constraint;
    }

    public calcConstraints(allCantons: Canton[], canton: Canton): void {
        const constraint = this.getOrCreateConstraint(canton.id);
        constraint.mechanicalConstraint = this.getMechanicalConstraint(canton);

        this.calcConstraintsFromConstraint(constraint, allCantons);

        this.replacementPole = this.poleMustBeReplaced()
            ? ReplacementPole.getReplacementPole(
                this.totalConstraintToPoleAngle,
                this.poleType?.symmetric ?? 0,
                this.totalConstraint.intensity,
                this.isHeadPole
            )
            : null;

        if (this.isForcedOrReplaced) {
            constraint.replacementPoleMechanicalConstraint = this.getMechanicalConstraint2(canton);
            this.calcReplacementPoleConstraints(constraint, allCantons, canton);
        }
    }

    private poleMustBeReplaced(): boolean {
        return this.type !== "F" && this.valid && 
               (!this.inGoodState || this.isNew || this.constraintRatio > this.securityCoefficient);
    }

    public calcConstraintsFromConstraint(constraint: Constraint, allCantons: Canton[]): void {
        this.totalMechanicalConstraint = this.constraints.reduce(
            (acc, c) => acc.add(c.mechanicalConstraint),
            new Vector()
        );

        this.windConstraint = this.getWindConstraint(allCantons);
        this.totalConstraint = this.totalMechanicalConstraint.add(this.windConstraint);
        this.totalConstraintToPoleAngle = roundAngle(this.totalConstraint.angle - this.rotation);
        const ratio = Pole.getStrengthByAngle(this.totalConstraintToPoleAngle, this.poleType?.symmetric ?? 0);
        this.strengthByTotalConstraintAngle = this.strength * ratio;
        this.constraintRatio = Math.round(this.totalConstraint.intensity / this.strengthByTotalConstraintAngle * 100) / 100;
    }

    public calcReplacementPoleConstraints(constraint: Constraint, allCantons: Canton[], canton: Canton): void {
        this.replacementPoleTotalMechanicalConstraint = this.constraints.reduce(
            (acc, c) => acc.add(c.replacementPoleMechanicalConstraint),
            new Vector()
        );

        this.replacementPoleWindConstraint = this.getReplacementPoleWindConstraintRp(allCantons);
        this.replacementPoleTotalConstraint = this.replacementPoleTotalMechanicalConstraint.add(this.replacementPoleWindConstraint);
        this.replacementPoleTotalConstraintToPoleAngle = roundAngle(this.replacementPoleTotalConstraint.angle - this.rotation);
        const ratio = Pole.getStrengthByAngle(this.replacementPoleTotalConstraintToPoleAngle, 1);
        this.replacementPoleStrengthByTotalConstraintAngle = (this.getReplacementPole()?.strength ?? 0) * ratio;
        this.replacementPoleConstraintRatio = Math.round(this.replacementPoleTotalConstraint.intensity / this.replacementPoleStrengthByTotalConstraintAngle * 100) / 100;
    }

    public getMechanicalConstraint(canton: Canton): Vector {
        const linkedLineSections = canton.sections
            .flatMap(s => s.lineSections.filter(ls => ls.line?.valid && ls.isLinked));

        const startPoleConstraint = linkedLineSections
            .filter(ls => ls.section?.startPole === this)
            .reduce((acc, ls) => acc.add(ls.getStartPoleMaxConstraintVector()), new Vector());

        const endPoleConstraint = linkedLineSections
            .filter(ls => ls.section?.endPole === this)
            .reduce((acc, ls) => acc.add(ls.getEndPoleMaxConstraintVector()), new Vector());

        return startPoleConstraint.add(endPoleConstraint);
    }

    public getMechanicalConstraint2(canton: Canton): Vector {
        const linkedLineSections = canton.sections
            .flatMap(s => s.lineSections.filter(ls => ls.line?.valid && ls.isLinked));

        const startPoleConstraint = linkedLineSections
            .filter(ls => ls.section?.startPole === this)
            .reduce((acc, ls) => acc.add(ls.getStartReplacementPoleMaxConstraintVector()), new Vector());

        const endPoleConstraint = linkedLineSections
            .filter(ls => ls.section?.endPole === this)
            .reduce((acc, ls) => acc.add(ls.getEndReplacementPoleMaxConstraintVector()), new Vector());

        return startPoleConstraint.add(endPoleConstraint);
    }

    public getWindConstraint(allCantons: Canton[]): Vector {
        const allLineSections = allCantons
            .flatMap(c => c.sections)
            .flatMap(s => s.lineSections.filter(ls => ls.line?.valid && ls.isLinked));

        const windConstraints = Array.from({ length: 360 }, (_, i) => i)
            .map(a => toRadian(a))
            .map(angle => {
                const start = allLineSections
                    .filter(ls => ls.section?.startPole === this)
                    .reduce((sum, ls) => sum + ls.getStartPoleWindConstraintVector(angle), 0);

                const end = allLineSections
                    .filter(ls => ls.section?.endPole === this)
                    .reduce((sum, ls) => sum + ls.getEndPoleWindConstraintVector(angle), 0);

                return Vector.from(start + end, angle);
            })
            .sort((a, b) => {
                const intensityA = Math.round(a.add(this.totalMechanicalConstraint).intensity * 1e8);
                const intensityB = Math.round(b.add(this.totalMechanicalConstraint).intensity * 1e8);
                if (intensityB !== intensityA) return intensityB - intensityA;
                return Math.round(b.add(this.totalMechanicalConstraint).angle * 1e8) - 
                       Math.round(a.add(this.totalMechanicalConstraint).angle * 1e8);
            });

        return windConstraints[0] ?? new Vector();
    }

    public getReplacementPoleWindConstraintRp(allCantons: Canton[]): Vector {
        const allLineSections = allCantons
            .flatMap(c => c.sections)
            .flatMap(s => s.lineSections.filter(ls => ls.line?.valid && ls.isLinked));

        const windConstraints = Array.from({ length: 360 }, (_, i) => i)
            .map(a => toRadian(a))
            .map(angle => {
                const start = allLineSections
                    .filter(ls => ls.section?.startPole === this)
                    .reduce((sum, ls) => sum + ls.getStartReplacementPoleWindConstraintVector(angle), 0);

                const end = allLineSections
                    .filter(ls => ls.section?.endPole === this)
                    .reduce((sum, ls) => sum + ls.getEndReplacementPoleWindConstraintVector(angle), 0);

                return Vector.from(start + end, angle);
            })
            .sort((a, b) => {
                const intensityA = Math.round(a.add(this.totalMechanicalConstraint).intensity * 1e8);
                const intensityB = Math.round(b.add(this.totalMechanicalConstraint).intensity * 1e8);
                if (intensityB !== intensityA) return intensityB - intensityA;
                return Math.round(b.add(this.totalMechanicalConstraint).angle * 1e8) - 
                       Math.round(a.add(this.totalMechanicalConstraint).angle * 1e8);
            });

        return windConstraints[0] ?? new Vector();
    }

    public static getStrengthByAngle(angle: number, symmetric: number): number {
        angle = Math.abs(angle);
        const h = Math.PI / 2;
        switch (symmetric) {
            case 0:
                return 1.0;
            case 1:
                return angle <= h ? 1.0 - 0.4 * angle / h : 0.6 + 0.4 * (angle - h) / h;
            case 2:
                return angle <= h ? 1.0 - 0.4 * angle / h : 0.6 - 0.1 * (angle - h) / h;
            default:
                throw new Error(`symmetric ${symmetric} not supported`);
        }
    }

    public securityCoefficientFormula(): string {
        const total = this.totalConstraint;
        const angle = Math.abs(this.totalConstraintToPoleAngle);
        switch (this.poleType?.symmetric ?? 0) {
            case 0:
                return `${this.strength.toFixed(0)}`;
            case 1:
                if (angle <= Math.PI / 2)
                    return `${this.strength.toFixed(0)} * (1 - 0.4 * ${toDegree(angle).toFixed(0)})° / 90° / ${total.intensity.toFixed(0)}`;
                else
                    return `${this.strength.toFixed(0)} * (0.6 + 0.4 * (${toDegree(angle).toFixed(0)})° - 90) / 90°) / ${total.intensity.toFixed(0)}`;
            case 2:
                if (angle <= Math.PI / 2)
                    return `${this.strength.toFixed(0)} * (1 - 0.4 * ${toDegree(angle).toFixed(0)})° / 90° / ${total.intensity.toFixed(0)}`;
                else
                    return `${this.strength.toFixed(0)} * (0.6 - 0.1 * (${toDegree(angle).toFixed(0)})° - 90) / 90°) / ${total.intensity.toFixed(0)}`;
        }
        return "";
    }

    public getPoleText(): string {
        const poleParameters = AppSettings.instance.poleParameters;
        let text = `${this.height.toFixed(0)} m, ${this.strength.toFixed(0)} daN`;
        if (poleParameters.showPoleConstraintRatio) {
            text += `, ${(this.constraintRatio * 100).toFixed(0)} %`;
        }
        if (this.isForcedOrReplaced) {
            text += ", à enlever";
        }
        return text;
    }

    public getReplacementText(): string {
        const poleParameters = AppSettings.instance.poleParameters;
        let text = `Nouveau poteau ${this.height.toFixed(0)} m, ${this.strength.toFixed(0)} daN`;
        if (poleParameters.showPoleConstraintRatio) {
            text += `, ${(this.constraintRatio * 100).toFixed(0)} %`;
        }
        text += ", à planter";
        if (this.mustBeReplaced) {
            text += " en lieu et place";
        }
        return text;
    }

    public clone(): Pole {
        const pole = new Pole();
        Object.assign(pole, this);
        pole.position = new Position(this.position.x, this.position.y);
        pole.constraints = this.constraints.map(c => {
            const constraint = new Constraint();
            Object.assign(constraint, c);
            return constraint;
        });
        return pole;
    }
}
