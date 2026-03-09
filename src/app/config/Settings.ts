export interface Settings {
    DisplayTemperature: number;
    ExtremeSummerTemperature: number;
    SummerTemperature: number;
    SummerCoefficientHigh: number;
    SummerCoefficientLow: number;
    WinterTemperature: number;
    WinterCoefficient: number;
    WindSpeed: number;
    DragCoefficient: number;
    GravitationalForce: number;
    AirSpecificWeight: number;
    MinLineHeight: number;
    MinLineHeightCrossingStreet: number;
}

export const settings: Settings = {
    DisplayTemperature: 15,
    ExtremeSummerTemperature: 40,
    SummerTemperature: 15,
    SummerCoefficientHigh: 0.7,
    SummerCoefficientLow: 0.5,
    WinterTemperature: -15,
    WinterCoefficient: 0.25,
    WindSpeed: 34.66,
    DragCoefficient: 1.45,
    GravitationalForce: 9.81,
    AirSpecificWeight: 1.225,
    MinLineHeight: 6,
    MinLineHeightCrossingStreet: 7,
};
