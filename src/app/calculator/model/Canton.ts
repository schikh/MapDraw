import { AppSettings } from '../configuration/AppSettings';
import { Line, ConstraintType } from './Line';
import { LineSection } from './LineSection';
import { Pole } from './Pole';
import { PoleReference } from './PoleReference';
import { Section } from './Section';

export class Canton {
    public id: number = 0;
    public displayTemperature: number;
    public calcUsingReplacementPoles: boolean = false;
    public summerConditions: boolean = true;
    public poleReferences: PoleReference[] = [];
    public sections: Section[] = [];
    public lines: Line[] = [];
    public allCantons: Canton[] = [];
    public version: number = 0;

    constructor() {
        const calculationParameters = AppSettings.instance.calculationParameters;
        this.displayTemperature = calculationParameters.displayTemperature;
    }

    public get tag(): string {
        return `CT-${this.id.toString().padStart(4, '0')}`;
    }

    public get orderedLines(): Line[] {
        return [...this.lines].sort((a, b) => a.constantHangingHeight - b.constantHangingHeight);
    }

    public get poles(): readonly Pole[] {
        return this.poleReferences.map(p => p.pole!).filter(p => p !== null);
    }

    public get invalid(): boolean {
        return this.poleReferences.length < 2 || 
               (this.poleReferences.length === 2 && this.poleReferences.some(p => p.id === 0));
    }

    public deepClone(): Canton {
        const canton = this.clone();
        const poles = this.poles.map(p => p.clone());
        canton.fixReferences(poles);
        return canton;
    }

    public clone(): Canton {
        const canton = new Canton();
        canton.id = this.id;
        canton.displayTemperature = this.displayTemperature;
        canton.calcUsingReplacementPoles = this.calcUsingReplacementPoles;
        canton.summerConditions = this.summerConditions;
        canton.version = this.version;
        canton.poleReferences = this.poleReferences.map(pr => {
            const ref = new PoleReference();
            ref.id = pr.id;
            return ref;
        });
        canton.sections = this.sections.map(s => {
            const section = new Section();
            Object.assign(section, s);
            section.lineSections = [];
            return section;
        });
        canton.lines = this.lines.map(l => {
            const line = new Line();
            Object.assign(line, l);
            line.lineSections = l.lineSections.map(ls => {
                const lineSection = new LineSection();
                Object.assign(lineSection, ls);
                return lineSection;
            });
            return line;
        });
        return canton;
    }

    public addPoles(poles: Pole[]): void {
        for (const pole of poles) {
            this.addPoleReference(pole.id);
        }
        this.fixReferences(poles);
    }

    public addPoleReference(id: number): void {
        const ref = new PoleReference();
        ref.id = id;
        this.poleReferences.push(ref);
        if (this.poleReferences.length > 1) {
            this.sections.push(new Section());
        }
    }

    public addLine(line: Line): void {
        line.fixConstantHangingHeight = true;
        if (line.constantHangingHeight === 0) {
            const maxHeight = this.lines.length > 0
                ? Math.max(...this.lines.map(l => l.constantHangingHeight))
                : 0;
            line.constantHangingHeight = maxHeight + 0.2;
        }
        line.addLineSections(this.sections);
        this.lines.push(line);
        line.canton = this;
    }

    public addNewLine(): Line {
        const line = new Line();
        line.id = this.lines.length;
        this.addLine(line);
        return line;
    }

    public fixReferences(poles: Pole[]): boolean {
        const result = this.fixPolesReferences(poles);
        if (result) {
            this.fixSectionsReferences();
            this.fixLinesReferences();
        }
        return result;
    }

    private fixPolesReferences(poles: Pole[]): boolean {
        for (const poleReference of this.poleReferences.filter(pr => pr.pole === null)) {
            poleReference.pole = poles.find(p => p.id === poleReference.id) ?? null;
            if (poleReference.pole === null) return false;
        }
        return true;
    }

    public fixSectionsReferences(): void {
        for (let i = 0; i < this.sections.length; i++) {
            this.sections[i].startPole = this.poleReferences[i].pole;
            this.sections[i].endPole = this.poleReferences[i + 1].pole;
        }
    }

    public fixLinesReferences(): void {
        for (const line of this.lines) {
            line.canton = this;
            for (let i = 0; i < this.sections.length; i++) {
                line.lineSections[i].line = line;
                line.lineSections[i].section = this.sections[i];
                this.sections[i].lineSections.push(line.lineSections[i]);
            }
        }
    }

    public calc(): void {
        this.calcSectionsSize();
        this.calcLineParameters();
        this.calcLinesConstraints();
        this.calcPolesConstraints(this.allCantons);
    }

    public calcSectionsSize(): void {
        let previousAngle = 0;
        for (let i = 0; i < this.sections.length; i++) {
            this.sections[i].setSectionSize(i, previousAngle);
            previousAngle = this.sections[i].angle;
        }
    }

    private calcLineParameters(): void {
        for (const line of this.lines.filter(l => l.valid)) {
            line.calcAverageSectionLength();
            line.calcOverloadParameters(AppSettings.instance.calculationParameters.windSpeed);
        }
    }

    private calcLinesConstraints(): void {
        const linesByConstraintType = new Map<ConstraintType, Line[]>();
        
        for (const line of this.lines.filter(l => l.valid && l.linkedLineSections.length > 0)) {
            const type = line.constraintType;
            if (!linesByConstraintType.has(type)) {
                linesByConstraintType.set(type, []);
            }
            linesByConstraintType.get(type)!.push(line);
        }

        const calculatedLines: Line[] = [];

        this.processLinesByConstraintType(linesByConstraintType, ConstraintType.FixHeight, (line) => {
            line.calcLineConstraintByMeasuredCableSag();
            line.calcSectionsSag();
            calculatedLines.push(line);
        });

        this.processLinesByConstraintType(linesByConstraintType, ConstraintType.FixMaxConstraint, (line) => {
            line.calcLineConstraintByFixMaxConstraint();
            line.calcSectionsSag();
            calculatedLines.push(line);
        });

        this.processLinesByConstraintType(linesByConstraintType, ConstraintType.FixConstraint, (line) => {
            line.calcLineConstraintByFixConstraint();
            line.calcSectionsSag();
            calculatedLines.push(line);
        });

        const linesToCalculate = linesByConstraintType.get(ConstraintType.Calculated);
        if (!linesToCalculate) return;

        const sortedLines = [...linesToCalculate].sort((a, b) => b.constantHangingHeight - a.constantHangingHeight);
        
        for (const line of sortedLines) {
            const referenceLineSection = this.getFirstCommonLineSection(calculatedLines, line);

            if (referenceLineSection) {
                line.calcLineConstraintParallelToLine(
                    referenceLineSection.section!,
                    referenceLineSection.sagAtSummerConditions,
                    referenceLineSection.replacementPoleSagAtSummerConditions
                );
            } else {
                line.calcLineConstraintByMinimumCableHeight();
            }

            line.calcSectionsSag();
            calculatedLines.push(line);
        }
    }

    private processLinesByConstraintType(
        linesByConstraintType: Map<ConstraintType, Line[]>,
        type: ConstraintType,
        action: (line: Line) => void
    ): void {
        const lines = linesByConstraintType.get(type);
        if (!lines) return;
        for (const line of lines) {
            action(line);
        }
    }

    private getFirstCommonLineSection(list: Line[], line: Line): LineSection | null {
        for (const l of list) {
            for (const ls of l.linkedLineSections) {
                const match = line.linkedLineSections.find(x => x.section === ls.section);
                if (match) return ls;
            }
        }
        return null;
    }

    private calcPolesConstraints(allCantons: Canton[]): void {
        for (const pole of this.poles) {
            pole.calcConstraints(allCantons, this);
        }
    }

    public removeLine(line: Line): void {
        const index = this.lines.indexOf(line);
        if (index > -1) {
            this.lines.splice(index, 1);
        }
        for (const ls of line.lineSections) {
            if (ls.section) {
                const lsIndex = ls.section.lineSections.indexOf(ls);
                if (lsIndex > -1) {
                    ls.section.lineSections.splice(lsIndex, 1);
                }
            }
        }
    }

    public getDisplayTemperature(): number {
        const calculationParameters = AppSettings.instance.calculationParameters;
        return this.summerConditions 
            ? calculationParameters.extremeSummerTemperature 
            : this.displayTemperature;
    }

    public poleHasMeasuredCableSag(i: number): boolean {
        if (i > 0 && this.lines.some(l => l.lineSections[i - 1].measuredCableSag > 0)) return true;
        if (i < this.poles.length - 1 && this.lines.some(l => l.lineSections[i].measuredCableSag > 0)) return true;
        return false;
    }

    public poleHasInternalLineTermination(i: number): boolean {
        return i > 0 && 
               i < this.poles.length - 1 && 
               this.lines.some(l => l.lineSections[i - 1].isLinked !== l.lineSections[i].isLinked);
    }

    public checkLinesCrossing(): boolean {
        for (const section of this.sections) {
            let previous: LineSection | null = null;
            const sortedLineSections = section.lineSections
                .filter(s => s.isLinked)
                .sort((a, b) => (a.line?.constantHangingHeight ?? 0) - (b.line?.constantHangingHeight ?? 0));
            
            for (const ls of sortedLineSections) {
                if (previous !== null && ls.hangingHeightFromTop <= previous.hangingHeightFromTop) return true;
                if (previous !== null && ls.hangingHeightEndFromTop <= previous.hangingHeightEndFromTop) return true;
                previous = ls;
            }
        }
        return false;
    }

    public getAttachedCantons(): Canton[] {
        const otherCantonIds = [...new Set(
            this.poles
                .flatMap(p => p.constraints)
                .map(c => c.cantonId)
                .filter(id => id !== this.id)
        )];
        return this.allCantons
            .filter(c => otherCantonIds.includes(c.id))
            .sort((a, b) => a.id - b.id);
    }

    public getVersion(): number {
        if (this.version === 0) {
            this.version = this.poleReferences[this.poleReferences.length - 1]?.id === 0 ? 1 : 2;
        }
        return this.version;
    }
}
