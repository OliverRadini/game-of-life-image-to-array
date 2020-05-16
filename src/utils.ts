export const range = (size: number) => [...Array(size).keys()];

export const removeSimilarConsecutiveNumbers = (items: number[]) =>
    items.filter((x, i) => {
        const previousItem = items[i - 1];

        if (previousItem === undefined) {
            return true;
        }

        return Math.abs(x - previousItem) <= 1;
    });

export const toAllConsecutivePairs = <T>(x: T[]) => x
    .map((y, i) => x[i+1] !== undefined ? [y, x[i+1]] : null)
    .filter(x => x !== null);

export const flattenOnce = <T>(x: T[][]) => x.reduce((p, c) => [...p, ...c], [])