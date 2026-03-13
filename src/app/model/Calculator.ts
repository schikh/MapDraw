import { settings } from "../config/Settings";
import { square, solveCubic } from "./MathUtils";

export class Calculator {
    // ──────────────────────────────────────────────
    //  Wind & overload helpers
    // ──────────────────────────────────────────────

    /**
     * Dynamic pressure of air.
     * Q = (a × v²) / (2 × g)
     *
     * @param windSpeed  Wind speed (m/s)
     * @returns Dynamic pressure (kg/m²)
     */
    public static airDynamicPressure(windSpeed: number): number {
        const g = settings.GravitationalForce;
        const a = settings.AirSpecificWeight;
        return (a * square(windSpeed)) / (2 * g);
    }

    /**
     * Wind force per metre of cable under summer conditions.
     * F = C × d × Q × coeff
     *
     * @param sectionLength  Span length (m) — used to select the summer coefficient
     * @param diameter       Cable diameter (m)
     * @param windSpeed      Wind speed (m/s)
     */
    public static getSummerWindForcePerMeter(
        sectionLength: number,
        diameter: number,
        windSpeed: number,
    ): number {
        const C = settings.DragCoefficient;
        const coeff =
            sectionLength > 100
                ? settings.SummerCoefficientLow
                : settings.SummerCoefficientHigh;
        const Q = Calculator.airDynamicPressure(windSpeed);
        return C * diameter * Q * coeff;
    }

    /**
     * Wind force per metre of cable under winter conditions.
     * F = C × d × Q × coeff
     *
     * @param diameter   Cable diameter (m)
     * @param windSpeed  Wind speed (m/s)
     */
    public static getWinterWindForcePerMeter(
        diameter: number,
        windSpeed: number,
    ): number {
        const C = settings.DragCoefficient;
        const coeff = settings.WinterCoefficient;
        const Q = Calculator.airDynamicPressure(windSpeed);
        return C * diameter * Q * coeff;
    }

    /**
     * Overload coefficients (no-wind, summer, winter).
     *
     * m = √((Pp + Pc)² + F²) / Pp
     *
     * @param carrierWeight    Weight of the carrier cable (kg/m)
     * @param surchargeWeight  Weight of surrounding cables (kg/m)
     * @param windForceSummer  Summer wind force per metre (kg/m)
     * @param windForceWinter  Winter wind force per metre (kg/m)
     */
    public static getOverloadCoefficients(
        carrierWeight: number,
        surchargeWeight: number,
        windForceSummer: number,
        windForceWinter: number,
    ): { overloadNoWind: number; summerOverload: number; winterOverload: number } {
        const totalWeight = carrierWeight + surchargeWeight;
        const overloadNoWind = totalWeight / carrierWeight;
        const summerOverload =
            Math.sqrt(square(totalWeight) + square(windForceSummer)) / carrierWeight;
        const winterOverload =
            Math.sqrt(square(totalWeight) + square(windForceWinter)) / carrierWeight;
        return { overloadNoWind, summerOverload, winterOverload };
    }

    /**
     * Critical span length — the span for which the maximum stress
     * in the conductor transitions between winter and summer regimes.
     *
     * Ac = (tm × S / W) × √(24 × α × (Tsummer − Twinter) / (mw² − ms²))
     *
     * @param usualConstraint     Maximum allowable stress (kg/mm²)
     * @param sectionArea         Cable cross-section (mm²)
     * @param weight              Cable weight (kg/mm²/km)
     * @param expansionCoef       Thermal expansion coefficient (°C⁻¹)
     * @param summerOverload      Summer overload coefficient
     * @param winterOverload      Winter overload coefficient
     */
    public static getCriticalLength(
        usualConstraint: number,
        sectionArea: number,
        weight: number,
        expansionCoef: number,
        summerOverload: number,
        winterOverload: number,
    ): number {
        const Tw = settings.WinterTemperature;
        const Ts = settings.SummerTemperature;
        return (
            (usualConstraint * sectionArea) /
            weight *
            Math.sqrt(
                (24 * expansionCoef * (Ts - Tw)) /
                (square(summerOverload) - square(winterOverload)),
            )
        );
    }

    /**
     * Determines the critical temperature and overload to use
     * based on whether the span is shorter or longer than the critical span.
     *
     * @param sectionLength   Actual span length (m)
     * @param criticalLength  Critical span length (m)
     * @param winterOverload  Winter overload coefficient
     * @param summerOverload  Summer overload coefficient
     */
    public static getCriticalTemperature(
        sectionLength: number,
        criticalLength: number,
        winterOverload: number,
        summerOverload: number,
    ): { overload: number; criticalTemperature: number } {
        if (sectionLength <= criticalLength) {
            return {
                overload: winterOverload,
                criticalTemperature: settings.WinterTemperature,
            };
        } else {
            return {
                overload: summerOverload,
                criticalTemperature: settings.SummerTemperature,
            };
        }
    }

    // ──────────────────────────────────────────────
    //  Core constraint calculation (change-of-state)
    // ──────────────────────────────────────────────

    /**
     * Solves the change-of-state equation for cable tension.
     *
     * Given a known state (constraint1, temperature1, overload1)
     * compute the tension at a new state (temperature2, overload2).
     *
     * The equation solved is:
     *   T³ + p3·T² + 0·T − p0 = 0
     *
     * where:
     *   p0 = E·ρ²·L²·m₂² / 24
     *   p1 = E·ρ²·L²·m₁² / (24·σ₁²)
     *   p2 = E·α·(θ₂ − θ₁)
     *   p3 = p1 + p2 − σ₁
     *
     * @param constraint1      Known tension (kg/mm²)
     * @param temperature1     Temperature at known state (°C)
     * @param overload1        Overload coefficient at known state
     * @param temperature2     Temperature at target state (°C)
     * @param overload2        Overload coefficient at target state
     * @param sectionLength    Span length (m)
     * @param elasticityModulus  Young's modulus E (kg/mm²)
     * @param specificWeight   Specific weight ρ (kg/mm²/m)
     * @param expansionCoefficient  Thermal expansion α (°C⁻¹)
     * @returns  The cable tension at the target state (kg/mm²)
     */
    public static calcConstraint(
        constraint1: number,
        temperature1: number,
        overload1: number,
        temperature2: number,
        overload2: number,
        sectionLength: number,
        elasticityModulus: number,
        specificWeight: number,
        expansionCoefficient: number,
    ): number {
        const p0 =
            elasticityModulus *
            square(specificWeight) *
            square(sectionLength) *
            square(overload2) /
            24;

        const p1 =
            elasticityModulus *
            square(specificWeight) *
            square(sectionLength) *
            square(overload1) /
            (24 * square(constraint1));

        const p2 =
            elasticityModulus *
            expansionCoefficient *
            (temperature2 - temperature1);

        const p3 = p1 + p2 - constraint1;

        // Solve: T³ + p3·T² + 0·T − p0 = 0
        const constraint2 = solveCubic(1, p3, 0, -p0);
        return constraint2;
    }
}
