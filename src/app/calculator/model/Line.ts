import { AppSettings, Cable, Material } from '../configuration/AppSettings';
import { Calculator } from './Calculator';
import { Canton } from './Canton';
import { LineSection } from './LineSection';
import { Section } from './Section';
import { roundHalf } from '../extensions/NumericExtensions';

export enum ConstraintType {
    Calculated = 0,
    FixConstraint = 1,
    FixHeight = 2,
    FixMaxConstraint = 3
}

export class Line {
    public id: number = 0;
    public startPoleId: number = 0;
    public endPoleId: number = 0;
    public cableMaterial: string | null = null;
    public cableType: string | null = null;

    public constraintType: ConstraintType = ConstraintType.Calculated;

    // constraint with wind at user selected T°
    public constraint: number = 0;
    // constraint with wind at critical T°
    public maxConstraint: number = 0;
    // constraint without wind at extreme summer T° (40°)
    public summerConstraint: number = 0;

    // constraint with wind at user selected T°
    public replacementPoleConstraint: number = 0;
    // constraint with wind at critical T°
    public replacementPoleMaxConstraint: number = 0;
    // constraint without wind at extreme summer T° (40°)
    public replacementPoleSummerConstraint: number = 0;

    public criticalTemperature: number = 0;
    public overload: number = 0;
    public overloadNoWind: number = 0;
    public winterOverload: number = 0;
    public summerOverload: number = 0;
    public constantHangingHeight: number = 0;
    public fixConstantHangingHeight: boolean = false;
    public averageSectionLength: number = 0;
    public newLine: boolean = false;

    public lineSections: LineSection[] = [];
    public canton: Canton | null = null;

    public get material(): Material | null {
        return AppSettings.instance.materials.find(m => m.name === this.cableMaterial) ?? null;
    }

    public get cable(): Cable | null {
        return this.material?.cables.find(c => c.type === this.cableType) ?? null;
    }

    public get linkedLineSections(): LineSection[] {
        return this.lineSections.filter(s => s.isLinked);
    }

    public get valid(): boolean {
        return this.cableMaterial !== null && this.cableType !== null;
    }

    public get isMaxConstraintOverLimit(): boolean {
        return !this.valid || isNaN(this.maxConstraint) || roundHalf(this.maxConstraint) > (this.cable?.maxConstraint ?? 0);
    }

    public get isMaxConstraintBelowLimit(): boolean {
        return !this.valid || isNaN(this.maxConstraint) || roundHalf(this.maxConstraint) < (this.cable?.minConstraint ?? 0);
    }

    public calcLineConstraintByMeasuredCableSag(): void {
        const lineSection = this.linkedLineSections.find(s => s.measuredCableSag > 0);
        if (!lineSection) return;

        const constraint = lineSection.calcConstraintByMeasuredCableSag();
        this.constraint = this.setConstraint(constraint, lineSection.measuredTemperature, this.overloadNoWind, lineSection.section?.length ?? 0);
        this.maxConstraint = this.setMaxConstraint(constraint, lineSection.measuredTemperature, this.overloadNoWind, lineSection.section?.length ?? 0);
        this.summerConstraint = this.setSummerConstraint(constraint, lineSection.measuredTemperature, this.overloadNoWind, lineSection.section?.length ?? 0);

        this.replacementPoleConstraint = this.constraint;
        this.replacementPoleMaxConstraint = this.maxConstraint;
        this.replacementPoleSummerConstraint = this.summerConstraint;
    }

    public calcLineConstraintByMinimumCableHeight(): void {
        const calculationParameters = AppSettings.instance.calculationParameters;
        
        const items = this.linkedLineSections
            .map(ls => ({ length: ls.section?.length ?? 0, constraint: ls.calcConstraintByMinimumCableHeight() }))
            .sort((a, b) => b.constraint - a.constraint);

        const item = items[0];
        if (item) {
            this.constraint = this.setConstraint(item.constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, item.length);
            this.maxConstraint = this.setMaxConstraint(item.constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, item.length);
            this.summerConstraint = this.setSummerConstraint(item.constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, item.length);
        }

        const replacementItems = this.linkedLineSections
            .map(ls => ({ length: ls.section?.length ?? 0, constraint: ls.calcReplacementPoleConstraintByMinimumCableHeight() }))
            .sort((a, b) => b.constraint - a.constraint);

        const replacementItem = replacementItems[0];
        if (replacementItem) {
            this.replacementPoleConstraint = this.setConstraint(replacementItem.constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, replacementItem.length);
            this.replacementPoleMaxConstraint = this.setMaxConstraint(replacementItem.constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, replacementItem.length);
            this.replacementPoleSummerConstraint = this.setSummerConstraint(replacementItem.constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, replacementItem.length);
        }
    }

    public calcLineConstraintParallelToLine(section: Section, sag: number, replacementPoleSag: number): void {
        const calculationParameters = AppSettings.instance.calculationParameters;
        const lineSection = this.linkedLineSections.find(x => x.section === section);
        if (!lineSection) return;

        const constraint = lineSection.calcConstraintByCableSag(sag);
        this.constraint = this.setConstraint(constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, section.length);
        this.maxConstraint = this.setMaxConstraint(constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, section.length);
        this.summerConstraint = this.setSummerConstraint(constraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, section.length);

        const replacementConstraint = lineSection.calcConstraintByCableSag(replacementPoleSag);
        this.replacementPoleConstraint = this.setConstraint(replacementConstraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, section.length);
        this.replacementPoleMaxConstraint = this.setMaxConstraint(replacementConstraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, section.length);
        this.replacementPoleSummerConstraint = this.setSummerConstraint(replacementConstraint, calculationParameters.extremeSummerTemperature, this.overloadNoWind, section.length);
    }

    public calcLineConstraintByFixConstraint(): void {
        this.maxConstraint = this.setMaxConstraint(this.constraint, this.canton?.getDisplayTemperature() ?? 0, this.overloadNoWind, this.averageSectionLength);
        this.summerConstraint = this.setSummerConstraint(this.constraint, this.canton?.getDisplayTemperature() ?? 0, this.overloadNoWind, this.averageSectionLength);

        this.replacementPoleConstraint = this.constraint;
        this.replacementPoleMaxConstraint = this.maxConstraint;
        this.replacementPoleSummerConstraint = this.summerConstraint;
    }

    public calcLineConstraintByFixMaxConstraint(): void {
        this.constraint = this.setConstraint(this.maxConstraint, this.criticalTemperature, this.overload, this.averageSectionLength);
        this.summerConstraint = this.setSummerConstraint(this.maxConstraint, this.criticalTemperature, this.overload, this.averageSectionLength);

        this.replacementPoleConstraint = this.constraint;
        this.replacementPoleMaxConstraint = this.maxConstraint;
        this.replacementPoleSummerConstraint = this.summerConstraint;
    }

    private setConstraint(constraint: number, temperature: number, overload: number, sectionLength: number): number {
        if (!this.cable) return 0;
        return Calculator.calcCableConstraint(
            this.cable,
            constraint,
            temperature,
            overload,
            this.canton?.getDisplayTemperature() ?? 0,
            this.overloadNoWind,
            sectionLength
        );
    }

    private setMaxConstraint(constraint: number, temperature: number, overload: number, sectionLength: number): number {
        if (!this.cable) return 0;
        return Calculator.calcCableConstraint(
            this.cable,
            constraint,
            temperature,
            overload,
            this.criticalTemperature,
            this.overload,
            sectionLength
        );
    }

    private setSummerConstraint(constraint: number, temperature: number, overload: number, sectionLength: number): number {
        const calculationParameters = AppSettings.instance.calculationParameters;
        if (!this.cable) return 0;
        return Calculator.calcCableConstraint(
            this.cable,
            constraint,
            temperature,
            overload,
            calculationParameters.extremeSummerTemperature,
            this.overloadNoWind,
            sectionLength
        );
    }

    public calcSectionsSag(): void {
        for (const l of this.linkedLineSections) {
            l.calcSag();
        }
    }

    public setSectionsHangingHeight(hangingHeight: number): void {
        this.lineSections.forEach(s => {
            if (s.section?.startPole && s.section?.endPole) {
                s.hangingHeightFromGround = s.section.startPole.aboveGroundHeight - hangingHeight;
                s.hangingHeightEndFromGround = s.section.endPole.aboveGroundHeight - hangingHeight;
            }
        });
    }

    public calcOverloadParameters(windSpeed: number): void {
        if (!this.cable) return;
        const result = Calculator.getOverloadParameters(this.cable, this.averageSectionLength, windSpeed);
        this.overloadNoWind = result.overloadNoWind;
        this.summerOverload = result.summerOverload;
        this.winterOverload = result.winterOverload;
        this.overload = result.overload;
        this.criticalTemperature = result.criticalTemperature;
    }

    public calcAverageSectionLength(): void {
        const sections = this.linkedLineSections;
        const cubesSum = sections.reduce((sum, x) => sum + Math.pow(x.section?.length ?? 0, 3), 0);
        const sumLength = sections.reduce((sum, x) => sum + (x.section?.length ?? 0), 0);
        this.averageSectionLength = Math.sqrt(cubesSum / sumLength);
    }

    public fixConstraintType(): void {
        if (this.constraintType === ConstraintType.FixHeight && this.lineSections.every(ls => ls.measuredCableSag === 0)) {
            this.constraintType = ConstraintType.Calculated;
        }
    }

    public addLineSections(sections: Section[]): void {
        for (const section of sections) {
            this.addLineSection(section);
        }
    }

    private addLineSection(section: Section): void {
        const lineSection = new LineSection();
        lineSection.line = this;
        lineSection.section = section;
        lineSection.hangingHeightFromGround = (section.startPole?.aboveGroundHeight ?? 0) - this.constantHangingHeight;
        lineSection.hangingHeightEndFromGround = (section.endPole?.aboveGroundHeight ?? 0) - this.constantHangingHeight;
        lineSection.isLinked = true;
        section.lineSections.push(lineSection);
        this.lineSections.push(lineSection);
    }
}
