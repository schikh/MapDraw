import { AppSettings } from '../configuration/AppSettings';
import { Calculator } from './Calculator';
import { Vector } from './Vector';
import { Section } from './Section';
import { Line } from './Line';

export class LineSection {
    private _hangingHeightFromGround: number = 0;
    private _hangingHeightEndFromGround: number = 0;

    public hangingHeight: number = 0;
    public hangingHeightEnd: number = 0;
    public measuredCableSag: number = 0;
    public measuredTemperature: number = 0;
    public sag: number = 0;
    public sagAtSummerConditions: number = 0;
    public replacementPoleSag: number = 0;
    public replacementPoleSagAtSummerConditions: number = 0;
    public isLinked: boolean = false;

    public section: Section | null = null;
    public line: Line | null = null;

    public get hangingHeightFromGround(): number {
        if (this.line?.fixConstantHangingHeight && this.section?.startPole) {
            return Math.round((this.section.startPole.aboveGroundHeight - this.line.constantHangingHeight) * 1e8) / 1e8;
        }
        return this._hangingHeightFromGround;
    }

    public set hangingHeightFromGround(value: number) {
        this._hangingHeightFromGround = value;
    }

    public get hangingHeightEndFromGround(): number {
        if (this.line?.fixConstantHangingHeight && this.section?.endPole) {
            return Math.round((this.section.endPole.aboveGroundHeight - this.line.constantHangingHeight) * 1e8) / 1e8;
        }
        return this._hangingHeightEndFromGround;
    }

    public set hangingHeightEndFromGround(value: number) {
        this._hangingHeightEndFromGround = value;
    }

    public get hangingHeightFromTop(): number {
        if (this.line?.fixConstantHangingHeight) {
            return this.line.constantHangingHeight;
        }
        return Math.round((this.section?.startPole?.aboveGroundHeight ?? 0) - this._hangingHeightFromGround * 1e8) / 1e8;
    }

    public set hangingHeightFromTop(value: number) {
        this._hangingHeightFromGround = Math.round((this.section?.startPole?.aboveGroundHeight ?? 0) - value * 1e8) / 1e8;
    }

    public get hangingHeightEndFromTop(): number {
        if (this.line?.fixConstantHangingHeight) {
            return this.line.constantHangingHeight;
        }
        return Math.round((this.section?.endPole?.aboveGroundHeight ?? 0) - this._hangingHeightEndFromGround * 1e8) / 1e8;
    }

    public set hangingHeightEndFromTop(value: number) {
        this._hangingHeightEndFromGround = Math.round((this.section?.endPole?.aboveGroundHeight ?? 0) - value * 1e8) / 1e8;
    }

    public get isToLow(): boolean {
        return Math.round(this.hangingHeightFromGround - this.sag * 100) / 100 < (this.section?.minLineHeight ?? 0);
    }

    public get isReplacementPoleToLow(): boolean {
        return Math.round(this.getStartReplacementPoleHangingHeightFromGround() - this.sag * 100) / 100 < (this.section?.minLineHeight ?? 0);
    }

    public getStartReplacementPoleHangingHeightFromGround(): number {
        if (this.section?.startPole?.isForced) {
            const aboveGroundHeight = this.section.startPole.forcedReplacementPole?.aboveGroundHeight ?? 0;
            const hangingHeight = this.line?.fixConstantHangingHeight ? this.line.constantHangingHeight : this.hangingHeightFromTop;
            return Math.round((aboveGroundHeight - hangingHeight) * 1e8) / 1e8;
        }
        if (this.section?.startPole?.isReplaced) {
            const aboveGroundHeight = this.section.startPole.replacementPole?.aboveGroundHeight ?? 0;
            const hangingHeight = this.line?.fixConstantHangingHeight ? this.line.constantHangingHeight : this.hangingHeightFromTop;
            return Math.round((aboveGroundHeight - hangingHeight) * 1e8) / 1e8;
        }
        return this.hangingHeightFromGround;
    }

    public getEndReplacementPoleHangingHeightFromGround(): number {
        if (this.section?.endPole?.isForced) {
            const aboveGroundHeight = this.section.endPole.forcedReplacementPole?.aboveGroundHeight ?? 0;
            const hangingHeight = this.line?.fixConstantHangingHeight ? this.line.constantHangingHeight : this.hangingHeightFromTop;
            return Math.round((aboveGroundHeight - hangingHeight) * 1e8) / 1e8;
        }
        if (this.section?.endPole?.isReplaced) {
            const aboveGroundHeight = this.section.endPole.replacementPole?.aboveGroundHeight ?? 0;
            const hangingHeight = this.line?.fixConstantHangingHeight ? this.line.constantHangingHeight : this.hangingHeightFromTop;
            return Math.round((aboveGroundHeight - hangingHeight) * 1e8) / 1e8;
        }
        return this.hangingHeightFromGround;
    }

    public getWindConstraint(angle: number): number {
        const calculationParameters = AppSettings.instance.calculationParameters;
        const windForcePerMeter = Calculator.getSummerWindForcePerMeter(
            this.section?.length ?? 0, 
            (this.line?.cable?.diameter ?? 0) / 1000, 
            calculationParameters.windSpeed
        );
        const windForce = windForcePerMeter * (this.section?.length ?? 0) / 2;
        const coefficient = Math.abs(Math.sin((this.section?.angle ?? 0) - angle));
        return windForce * coefficient;
    }

    public calcConstraintByMinimumCableHeight(): number {
        const sag = this.hangingHeightFromGround - (this.section?.minLineHeight ?? 0);
        return Calculator.calcConstraintFromSag(
            this.section?.length ?? 0,
            this.line?.cable?.specificWeight ?? 0,
            this.line?.overloadNoWind ?? 0,
            sag
        );
    }

    public calcReplacementPoleConstraintByMinimumCableHeight(): number {
        const sag = this.getStartReplacementPoleHangingHeightFromGround() - (this.section?.minLineHeight ?? 0);
        return Calculator.calcConstraintFromSag(
            this.section?.length ?? 0,
            this.line?.cable?.specificWeight ?? 0,
            this.line?.overloadNoWind ?? 0,
            sag
        );
    }

    public calcConstraintByCableSag(sag: number): number {
        return Calculator.calcConstraintFromSag(
            this.section?.length ?? 0,
            this.line?.cable?.specificWeight ?? 0,
            this.line?.overloadNoWind ?? 0,
            sag
        );
    }

    public calcConstraintByMeasuredCableSag(): number {
        return Calculator.calcConstraintFromSag(
            this.section?.length ?? 0,
            this.line?.cable?.specificWeight ?? 0,
            this.line?.overloadNoWind ?? 0,
            this.measuredCableSag
        );
    }

    public calcSag(): void {
        const hangingHeightFromGround = this.hangingHeightFromGround;
        const sag = Calculator.calcSag(
            this.section?.length ?? 0,
            this.line?.cable?.specificWeight ?? 0,
            this.line?.overloadNoWind ?? 0,
            this.line?.constraint ?? 0
        );
        const sagAtSummerConditions = Calculator.calcSag(
            this.section?.length ?? 0,
            this.line?.cable?.specificWeight ?? 0,
            this.line?.overloadNoWind ?? 0,
            this.line?.summerConstraint ?? 0
        );
        this.sag = Math.min(sag, hangingHeightFromGround);
        this.sagAtSummerConditions = Math.min(sagAtSummerConditions, hangingHeightFromGround);

        const replacementPoleHangingHeightFromGround = this.getStartReplacementPoleHangingHeightFromGround();
        const replacementPoleSag = Calculator.calcSag(
            this.section?.length ?? 0,
            this.line?.cable?.specificWeight ?? 0,
            this.line?.overloadNoWind ?? 0,
            this.line?.replacementPoleConstraint ?? 0
        );
        const replacementPoleSagAtSummerConditions = Calculator.calcSag(
            this.section?.length ?? 0,
            this.line?.cable?.specificWeight ?? 0,
            this.line?.overloadNoWind ?? 0,
            this.line?.replacementPoleSummerConstraint ?? 0
        );
        this.replacementPoleSag = Math.min(replacementPoleSag, replacementPoleHangingHeightFromGround);
        this.replacementPoleSagAtSummerConditions = Math.min(replacementPoleSagAtSummerConditions, replacementPoleHangingHeightFromGround);
    }

    public getStartPoleMaxConstraintVector(): Vector {
        const intensity = (this.line?.maxConstraint ?? 0) * (this.line?.cable?.sectionArea ?? 0);
        const coefficient = this.getStartPoleCoefficient();
        return Vector.from(intensity * coefficient, this.section?.angle ?? 0);
    }

    public getStartReplacementPoleMaxConstraintVector(): Vector {
        const intensity = (this.line?.replacementPoleMaxConstraint ?? 0) * (this.line?.cable?.sectionArea ?? 0);
        const coefficient = this.getStartReplacementPoleCoefficient();
        return Vector.from(intensity * coefficient, this.section?.angle ?? 0);
    }

    public getEndPoleMaxConstraintVector(): Vector {
        const intensity = (this.line?.maxConstraint ?? 0) * (this.line?.cable?.sectionArea ?? 0);
        const coefficient = this.getEndPoleCoefficient();
        return Vector.from(intensity * coefficient, (this.section?.angle ?? 0) + Math.PI);
    }

    public getEndReplacementPoleMaxConstraintVector(): Vector {
        const intensity = (this.line?.replacementPoleMaxConstraint ?? 0) * (this.line?.cable?.sectionArea ?? 0);
        const coefficient = this.getEndReplacementPoleCoefficient();
        return Vector.from(intensity * coefficient, (this.section?.angle ?? 0) + Math.PI);
    }

    public getStartPoleWindConstraintVector(angle: number): number {
        const intensity = this.getWindConstraint(angle);
        const coefficient = this.getStartPoleCoefficient();
        return intensity * coefficient;
    }

    public getStartReplacementPoleWindConstraintVector(angle: number): number {
        const intensity = this.getWindConstraint(angle);
        const coefficient = this.getStartReplacementPoleCoefficient();
        return intensity * coefficient;
    }

    public getEndPoleWindConstraintVector(angle: number): number {
        const intensity = this.getWindConstraint(angle);
        const coefficient = this.getEndPoleCoefficient();
        return intensity * coefficient;
    }

    public getEndReplacementPoleWindConstraintVector(angle: number): number {
        const intensity = this.getWindConstraint(angle);
        const coefficient = this.getEndReplacementPoleCoefficient();
        return intensity * coefficient;
    }

    private getStartPoleCoefficient(): number {
        const aboveGroundHeight = this.section?.startPole?.aboveGroundHeight ?? 1;
        return this.hangingHeightFromGround / aboveGroundHeight;
    }

    private getEndPoleCoefficient(): number {
        const aboveGroundHeight = this.section?.endPole?.aboveGroundHeight ?? 1;
        return this.hangingHeightEndFromGround / aboveGroundHeight;
    }

    private getStartReplacementPoleCoefficient(): number {
        const hangingHeightFromGround = this.getStartReplacementPoleHangingHeightFromGround();
        const aboveGroundHeight = this.section?.startPole?.getReplacementPole()?.aboveGroundHeight ?? 1;
        return hangingHeightFromGround / aboveGroundHeight;
    }

    private getEndReplacementPoleCoefficient(): number {
        const hangingHeightFromGround = this.getEndReplacementPoleHangingHeightFromGround();
        const aboveGroundHeight = this.section?.endPole?.getReplacementPole()?.aboveGroundHeight ?? 1;
        return hangingHeightFromGround / aboveGroundHeight;
    }
}
