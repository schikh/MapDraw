import { AppSettings, Cable } from '../configuration/AppSettings';

export class Calculator {
    private static get settings() {
        return AppSettings.instance.calculationParameters;
    }

    public static getPoleAboveGroundHeight(height: number): number {
        return Math.max(height * 0.9 - 0.6, 0);
    }

    public static airDynamicPressure(windSpeed: number): number {
        // calcul de la pression dynamique
        // Q = (a x v²) : 2 g
        const gForce = this.settings.gravitationalForce;
        const airSpecificWeight = this.settings.airSpecificWeight;
        return airSpecificWeight * this.square(windSpeed) / (2 * gForce);
    }

    public static getSummerWindForcePerMeter(sectionLength: number, diameter: number, windSpeed: number): number {
        // calcul de l'effort du vent en conditions été
        // F = C x Q x A * coeff (kg/m²)
        const dragCoefficient = this.settings.dragCoefficient;
        const summerCoef = sectionLength > 100 ? this.settings.summerCoefficientLow : this.settings.summerCoefficientHigh;
        const airDynamicPressure = this.airDynamicPressure(windSpeed);
        return dragCoefficient * diameter * airDynamicPressure * summerCoef;
    }

    public static getWinterWindForcePerMeter(diameter: number, windSpeed: number): number {
        // calcul de l'effort du vent en conditions hiver.
        const dragCoefficient = this.settings.dragCoefficient;
        const winterCoef = this.settings.winterCoefficient;
        const airDynamicPressure = this.airDynamicPressure(windSpeed);
        return dragCoefficient * diameter * airDynamicPressure * winterCoef;
    }

    public static getOverloadCoefficients(
        poidsDuPorteur: number,
        poidsSurchargeDuCable: number,
        windForceEte: number,
        windForceHiver: number
    ): { overloadNoWind: number; summerOverload: number; winterOverload: number } {
        // calcul coefficient de surcharge 
        const poidsCableTotal = poidsDuPorteur + poidsSurchargeDuCable;
        const overloadNoWind = poidsCableTotal / poidsDuPorteur;
        const summerOverload = this.sqrt(this.square(poidsCableTotal) + this.square(windForceEte)) / poidsDuPorteur;
        const winterOverload = this.sqrt(this.square(poidsCableTotal) + this.square(windForceHiver)) / poidsDuPorteur;
        return { overloadNoWind, summerOverload, winterOverload };
    }

    public static getCriticalLength(
        usualConstraint: number,
        sectionArea: number,
        poidsDuPorteur: number,
        coefDilatation: number,
        summerOverload: number,
        winterOverload: number
    ): number {
        // calcul de la portée critique
        const winterTemperature = this.settings.winterTemperature;
        const summerTemperature = this.settings.summerTemperature;
        return usualConstraint * sectionArea / poidsDuPorteur * 
            this.sqrt(24 * coefDilatation * (summerTemperature - winterTemperature) / 
            (this.square(summerOverload) - this.square(winterOverload)));
    }

    public static getCriticalTemperature(
        sectionLength: number,
        criticalSection: number,
        winterOverload: number,
        summerOverload: number
    ): { overload: number; temperature: number } {
        const winterTemperature = this.settings.winterTemperature;
        const summerTemperature = this.settings.summerTemperature;
        return sectionLength <= criticalSection 
            ? { overload: winterOverload, temperature: winterTemperature }
            : { overload: summerOverload, temperature: summerTemperature };
    }

    public static getOverloadParameters(
        cable: Cable,
        sectionLength: number,
        windSpeed: number
    ): {
        overloadNoWind: number;
        summerOverload: number;
        winterOverload: number;
        overload: number;
        criticalTemperature: number;
    } {
        const summerWindForce = this.getSummerWindForcePerMeter(sectionLength, cable.diameter / 1000, windSpeed);
        const winterWindForce = this.getWinterWindForcePerMeter(cable.diameter / 1000, windSpeed);
        const { overloadNoWind, summerOverload, winterOverload } = this.getOverloadCoefficients(
            cable.weight, cable.carrierWeight, summerWindForce, winterWindForce
        );
        const criticalLength = this.getCriticalLength(
            cable.normalTraction, cable.sectionArea, cable.weight, 
            cable.expansionCoefficient, summerOverload, winterOverload
        );
        const { overload, temperature: criticalTemperature } = this.getCriticalTemperature(
            sectionLength, criticalLength, winterOverload, summerOverload
        );
        return { overloadNoWind, summerOverload, winterOverload, overload, criticalTemperature };
    }

    public static calcCableConstraint(
        cable: Cable,
        constraint1: number,
        temperature1: number,
        m1: number,
        temperature2: number,
        m2: number,
        sectionLength: number
    ): number {
        return this.calcConstraint(
            constraint1, temperature1, m1,
            temperature2, m2,
            sectionLength,
            cable.elasticityModulus,
            cable.specificWeight,
            cable.expansionCoefficient
        );
    }

    public static calcConstraint(
        constraint1: number,
        temperature1: number,
        m1: number,
        temperature2: number,
        m2: number,
        sectionLength: number,
        elasticityModulus: number,
        specificWeight: number,
        expansionCoefficient: number
    ): number {
        const p0 = elasticityModulus * this.square(specificWeight) * this.square(sectionLength) * this.square(m2) / 24;
        const p1 = elasticityModulus * this.square(specificWeight) * this.square(sectionLength) * this.square(m1) / (24 * this.square(constraint1));
        const p2 = elasticityModulus * expansionCoefficient * (temperature2 - temperature1);
        const p3 = p1 + p2 - constraint1;
        const constraint2 = this.solveCubic(1, p3, 0, -p0);
        return constraint2;
    }

    public static calcConstraintFromSag(
        sectionLength: number,
        specificWeight: number,
        overloadNoWind: number,
        sag: number
    ): number {
        if (sag <= 0) return Number.MAX_VALUE;
        return this.square(sectionLength) * specificWeight * overloadNoWind / (8 * sag);
    }

    public static calcSag(
        sectionLength: number,
        specificWeight: number,
        overloadNoWind: number,
        constraint: number
    ): number {
        if (constraint <= 0) return Number.MAX_VALUE;
        return this.square(sectionLength) * specificWeight * overloadNoWind / (8 * constraint);
    }

    public static solveCubic(a: number, b: number, c: number, d: number): number {
        const f = (3 * c / a - b * b / (a * a)) / 3;
        const g = (2 * this.cube(b) / this.cube(a) - 9 * b * c / this.square(a) + 27 * d / a) / 27;
        const h = this.square(g) / 4 + this.cube(f) / 27;

        if (h === 0 && f === 0 && g === 0) {
            return -this.cbrt(d / a);
        }

        let x: number;
        if (h <= 0) {
            const i = this.sqrt(this.square(g) / 4 - h);
            const j = this.cbrt(i);
            const k = Math.acos(-g / (2 * i));
            const l = Math.cos(k / 3);
            x = 2 * j * l;
        } else {
            const r = -g / 2 + this.sqrt(h);
            const t = -g / 2 - this.sqrt(h);
            const s = r < 0 ? -this.cbrt(-r) : this.cbrt(r);
            const v = t < 0 ? -this.cbrt(-t) : this.cbrt(t);
            x = s + v;
        }
        return x - b / (3 * a);
    }

    public static getStrengthByPoleAngle(angle: number, symmetric: number): number {
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

    private static cbrt(x: number): number {
        return Math.pow(x, 1.0 / 3.0);
    }

    private static square(value: number): number {
        return Math.pow(value, 2);
    }

    private static cube(value: number): number {
        return Math.pow(value, 3);
    }

    private static sqrt(value: number): number {
        return Math.pow(value, 0.5);
    }
}
