/**
 * Returns x².
 */
export function square(x: number): number {
    return x * x;
}

/**
 * Solves the cubic equation  a·x³ + b·x² + c·x + d = 0
 * and returns the largest real positive root.
 *
 * Uses Newton-Raphson iteration, which is numerically stable
 * for the change-of-state equation in cable mechanics.
 */
export function solveCubic(a: number, b: number, c: number, d: number): number {
    // f(x) = a·x³ + b·x² + c·x + d
    // f'(x) = 3a·x² + 2b·x + c
    const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
    const fp = (x: number) => 3 * a * x * x + 2 * b * x + c;

    // Choose a good starting guess: try a few candidates and pick the one
    // closest to a root with positive value tendency.
    // For the cable equation T³ + p3·T² + 0·T − p0 = 0  (a=1, d=-p0 < 0)
    // the positive root is typically in the range [|b|/3 .. 2|b|].
    const candidates = [1, 10, Math.abs(b), Math.abs(b) / 2, Math.abs(b) * 2, 100];
    let bestGuess = candidates[0];
    let bestAbsF = Math.abs(f(candidates[0]));
    for (const candidate of candidates) {
        if (candidate <= 0) continue;
        const absF = Math.abs(f(candidate));
        if (absF < bestAbsF) {
            bestAbsF = absF;
            bestGuess = candidate;
        }
    }

    let x = bestGuess;
    const maxIterations = 1000;
    const tolerance = 1e-12;

    for (let i = 0; i < maxIterations; i++) {
        const fx = f(x);
        const fpx = fp(x);

        if (Math.abs(fpx) < 1e-30) {
            // Derivative near zero — nudge to escape
            x += 0.1;
            continue;
        }

        const dx = fx / fpx;
        x = x - dx;

        // Keep x positive (physical constraint: tension > 0)
        if (x <= 0) {
            x = 0.01;
        }

        if (Math.abs(dx) < tolerance) {
            break;
        }
    }

    return x;
}
