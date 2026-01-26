const _2pi = 2 * Math.PI;

/**
 * Returns angle between -PI and PI
 */
export function roundAngle(value: number): number {
    let angle = value % _2pi;
    if (angle <= -Math.PI) {
        angle += _2pi;
    } else if (angle > Math.PI) {
        angle -= _2pi;
    }
    return angle;
}

/**
 * Returns angle between 0 and 2PI
 */
export function roundAngle2(value: number): number {
    let angle = value % _2pi;
    if (angle < 0) {
        angle += _2pi;
    }
    return angle;
}

export function toDegree(value: number): number {
    return value / Math.PI * 180;
}

export function toRadian(value: number): number {
    return value * Math.PI / 180;
}

export function roundHalf(value: number): number {
    return Math.round(value * 2) / 2;
}
