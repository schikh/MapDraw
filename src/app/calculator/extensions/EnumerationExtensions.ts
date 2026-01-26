/**
 * Full outer join with distinct results
 */
export function fullJoinDistinct<TLeft, TRight, TKey, TResult>(
    leftItems: TLeft[],
    rightItems: TRight[],
    leftKeySelector: (left: TLeft) => TKey,
    rightKeySelector: (right: TRight) => TKey,
    resultSelector: (left: TLeft | null, right: TRight | null) => TResult
): TResult[] {
    const results: TResult[] = [];
    const rightMap = new Map<TKey, TRight>();

    for (const right of rightItems) {
        rightMap.set(rightKeySelector(right), right);
    }

    const usedRightKeys = new Set<TKey>();

    // Left join
    for (const left of leftItems) {
        const leftKey = leftKeySelector(left);
        const right = rightMap.get(leftKey) ?? null;
        if (right !== null) {
            usedRightKeys.add(leftKey);
        }
        results.push(resultSelector(left, right));
    }

    // Right join (items not in left)
    for (const right of rightItems) {
        const rightKey = rightKeySelector(right);
        if (!usedRightKeys.has(rightKey)) {
            results.push(resultSelector(null, right));
        }
    }

    // Make distinct
    const uniqueResults: TResult[] = [];
    const seen = new Set<string>();
    for (const result of results) {
        const key = JSON.stringify(result);
        if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push(result);
        }
    }

    return uniqueResults;
}

/**
 * Find index in a readonly array
 */
export function findIndex<T>(list: readonly T[], match: (item: T) => boolean): number {
    for (let i = 0; i < list.length; i++) {
        if (match(list[i])) return i;
    }
    return -1;
}
