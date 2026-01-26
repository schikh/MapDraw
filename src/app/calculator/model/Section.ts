import { AppSettings } from '../configuration/AppSettings';
import { Pole } from './Pole';
import { LineSection } from './LineSection';

export class Section {
    public length: number = 0;
    public angle: number = 0;
    public baseAngle: number = 0;
    public crossStreet: boolean = false;

    public startPole: Pole | null = null;
    public endPole: Pole | null = null;
    public lineSections: LineSection[] = [];

    public get linkedLineSections(): LineSection[] {
        return this.lineSections.filter(s => s.line?.valid && s.isLinked);
    }

    public get minLineHeight(): number {
        const calculationParameters = AppSettings.instance.calculationParameters;
        return this.crossStreet 
            ? calculationParameters.minLineHeightCrossingStreet 
            : calculationParameters.minLineHeight;
    }

    public setSectionSize(index: number, previousAngle: number): void {
        if (this.startPole && this.endPole) {
            this.angle = this.startPole.position.angleTo(this.endPole.position);
            this.length = this.startPole.position.distanceTo(this.endPole.position);
            this.baseAngle = index === 0 ? 0 : this.angle - previousAngle;
        }
    }

    public get tag(): string {
        const minId = Math.min(this.startPole?.id ?? 0, this.endPole?.id ?? 0);
        const maxId = Math.max(this.startPole?.id ?? 0, this.endPole?.id ?? 0);
        return `T-${minId.toString().padStart(4, '0')}#${maxId.toString().padStart(4, '0')}`;
    }

    public getSectionCharacteristicsText(): string {
        let sb = `Portée ${this.length.toFixed(0)} m\n`;
        const orderedLineSections = [...this.linkedLineSections].sort((a, b) => 
            (a.line?.constantHangingHeight ?? 0) - (b.line?.constantHangingHeight ?? 0)
        );
        for (const ls of orderedLineSections) {
            const text = ls.line?.newLine 
                ? `{\\C66;${ls.line.cableType} à tirer}` 
                : ls.line?.cableType ?? '';
            sb += text + '\n';
        }
        return sb;
    }

    public getFirstCableSagText(): string {
        const lineSection = [...this.linkedLineSections]
            .sort((a, b) => (a.line?.constantHangingHeight ?? 0) - (b.line?.constantHangingHeight ?? 0))[0];
        
        if (!lineSection || lineSection.measuredCableSag === 0) {
            return "";
        }
        return `Flèche ${lineSection.measuredCableSag.toFixed(2)} m à ${lineSection.measuredTemperature.toFixed(0)} °c`;
    }

    public getSectionDescriptionsLayerName(): string {
        const parameters = AppSettings.instance.parameters;
        return this.linkedLineSections.some(ls => ls.line?.newLine)
            ? parameters.sectionWithNewLineDescriptionsLayerName
            : parameters.sectionDescriptionsLayerName;
    }
}
