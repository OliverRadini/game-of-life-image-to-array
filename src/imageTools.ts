import { removeSimilarConsecutiveNumbers, flattenOnce, toAllConsecutivePairs } from "./utils";

export interface IPixelData {
    red: number;
    green: number;
    blue: number;
}

export interface ISquare {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}


export const pixelsMatch = (pixelA: IPixelData) => (pixelB: IPixelData) => pixelA.red === pixelB.red
    && pixelA.green === pixelB.green
    && pixelA.blue === pixelB.blue;

export const determineGridSize = (pixelData: IPixelData[][]) => {
    const gridLinePixel: IPixelData = { red: 235, green: 235, blue: 235 };
    const matchesGridLinePixel = pixelsMatch(gridLinePixel);

    const indicesForHorizontalLines = pixelData[0]
        .map(matchesGridLinePixel)
        .map((matches, i) => [matches, i])
        .filter(x => x[0])
        .map(x => x[1]) as number[];

    const indicesForVerticalLines = pixelData
        .map(x => x[0])
        .map(matchesGridLinePixel)
        .map((matches, i) => [matches, i])
        .filter(x => x[0])
        .map(x => x[1]) as number[];
        
    return {
        indicesForVerticalLines: removeSimilarConsecutiveNumbers(indicesForVerticalLines),
        indicesForHorizontalLines: removeSimilarConsecutiveNumbers(indicesForHorizontalLines),
    };
};

export const pixelSumReducer = (p: IPixelData, c: IPixelData): IPixelData => ({
    red: p.red + c.red,
    green: p.green + c.green,
    blue: p.blue + c.blue,
});

export const getAverageColourForPixelSquare = (pixelData: IPixelData[][]) => (square: ISquare) => {
    const allPixelsInSquare = flattenOnce(
        pixelData.slice(square.y1, square.y2)
            .map(pixelRow => pixelRow.slice(square.x1, square.x2))
    )   

    const summedPixelValues = allPixelsInSquare
        .reduce(pixelSumReducer, { red: 0, green: 0, blue: 0});

    return {
        red: summedPixelValues.red / allPixelsInSquare.length,
        green: summedPixelValues.green / allPixelsInSquare.length,
        blue: summedPixelValues.blue / allPixelsInSquare.length,
    };
};

const lineDataToSquare = (lineData: { horizontalPair: [number, number], verticalPair: [number, number] }): ISquare => ({
    x1: lineData.horizontalPair[0],
    x2: lineData.horizontalPair[1],
    y1: lineData.verticalPair[0],
    y2: lineData.verticalPair[1],
});

export const gridLinesToPixelCoordinateSquares = (gridLines: ReturnType<typeof determineGridSize>): ISquare[][] => {
    const horizontalGridLinePairs = toAllConsecutivePairs(gridLines.indicesForHorizontalLines);
    const vertialGridLinePairs = toAllConsecutivePairs(gridLines.indicesForVerticalLines);

    const returnData = vertialGridLinePairs 
        .map(
            verticalPair => horizontalGridLinePairs 
                .map(
                    horizontalPair => ({
                        horizontalPair,
                        verticalPair,
                    })
                )
        )
        .map(x => x.map(lineDataToSquare));

    return returnData;
};
