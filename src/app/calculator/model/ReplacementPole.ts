import { AppSettings } from '../configuration/AppSettings';
import { Calculator } from './Calculator';

export class ReplacementPole {
    public strength: number = 0;
    public height: number = 0;
    public constraintRatio: number = 0;

    public get aboveGroundHeight(): number {
        return Calculator.getPoleAboveGroundHeight(this.height);
    }

    public static getReplacementPole(
        angle: number,
        symmetric: number,
        intensity: number,
        isHeadPole: boolean
    ): ReplacementPole | null {
        const replacementPoleParameters = AppSettings.instance.replacementPoleParameters;
        
        const list = replacementPoleParameters.strengths
            .filter(s => !isHeadPole || s >= replacementPoleParameters.minHeadStrength)
            .sort((a, b) => a - b)
            .map(s => ReplacementPole.getReplacementPoleByStrength(angle, s, symmetric, intensity));

        const replacementPole = list.find(r => r.constraintRatio <= replacementPoleParameters.securityCoefficients);
        return replacementPole ?? list[list.length - 1] ?? null;
    }

    public static getReplacementPoleByStrength(
        angle: number,
        strength: number,
        symmetric: number,
        intensity: number
    ): ReplacementPole {
        const replacementPoleParameters = AppSettings.instance.replacementPoleParameters;
        const pole = new ReplacementPole();
        pole.height = replacementPoleParameters.minHeadHeight;
        pole.strength = strength;
        pole.constraintRatio = ReplacementPole.getConstraintRatio(angle, strength, symmetric, intensity);
        return pole;
    }

    public static getConstraintRatio(
        angle: number,
        strength: number,
        symmetric: number,
        intensity: number
    ): number {
        const ratio = Calculator.getStrengthByPoleAngle(angle, symmetric);
        return intensity / (strength * ratio);
    }

    public getReplacementText(replacePole: boolean, newPole: boolean, constraintRatio: number): string {
        const poleParameters = AppSettings.instance.poleParameters;
        let text = `${this.height.toFixed(0)} m, ${this.strength.toFixed(0)} daN`;
        if (poleParameters.showPoleConstraintRatio) {
            text += `, ${(constraintRatio * 100).toFixed(0)} %`;
        }
        text += ", à planter";
        if (replacePole) {
            text += " en lieu et place";
        }
        text = newPole ? "Nouveau poteau " + text : `(${text})`;
        return text;
    }
}
