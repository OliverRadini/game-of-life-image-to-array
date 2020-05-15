import { createReadStream } from 'fs';
import { PNG } from 'pngjs';

type FAILURE = 'FAILURE';
const failure: FAILURE = 'FAILURE';

// interface IReadFile {
//     (fileLocation: string): Promise<"failure" | Buffer>;
// }

// const readFile: IReadFile = fileLocation => new Promise((res, _) => {
//     nodeReadFile(fileLocation, (error, buffer) => {
//         if (error) {
//             res("failure");
//             return;
//         }

//         res(buffer);
//         return;
//     });
// });

const range = (size: number) => [...Array(size).keys()];

interface IPixelData {
    red: number;
    green: number;
    blue: number;
}

const loadPngFromFileLocation = (location: string): Promise<FAILURE | IPixelData[][]> => new Promise((res, _) => {
    createReadStream(location)
        .pipe(new PNG())
        .on("parsed", function () {
            const laidOutData =  range(this.height).map(
                y => range(this.width)
                    .map(
                        x => {
                            const index = (this.width * y + x) << 2;

                            const red = this.data[index];
                            const green = this.data[index + 1];
                            const blue = this.data[index + 2];

                            return {
                                red,
                                green,
                                blue,
                            } as IPixelData;
                        }
                    ),
            );

            res(laidOutData);
            return;
        })
        .on("error", () => res(failure));
});

const pixelsMatch = (pixelA: IPixelData) => (pixelB: IPixelData) => pixelA.red === pixelB.red
    && pixelA.green === pixelB.green
    && pixelA.blue === pixelB.blue;

const determineGridSize = (pixelData: IPixelData[][]) => {
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

const removeSimilarConsecutiveNumbers = (items: number[]) =>
    items.filter((x, i) => {
        const previousItem = items[i - 1];

        if (previousItem === undefined) {
            return true;
        }

        return Math.abs(x - previousItem) <= 1;
    });

const toAllConsecutivePairs = <T>(x: T[]) => x
    .map((y, i) => x[i+1] !== undefined ? [y, x[i+1]] : null)
    .filter(x => x !== null);

interface ISquare {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

const lineDataToSquare = (lineData: { horizontalPair: [number, number], verticalPair: [number, number] }): ISquare => ({
    x1: lineData.horizontalPair[0],
    x2: lineData.horizontalPair[1],
    y1: lineData.verticalPair[0],
    y2: lineData.verticalPair[1],
});

const gridLinesToPixelCoordinateSquares = (gridLines: ReturnType<typeof determineGridSize>): ISquare[][] => {
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

const flattenOnce = <T>(x: T[][]) => x.reduce((p, c) => [...p, ...c], [])

const pixelSumReducer = (p: IPixelData, c: IPixelData): IPixelData => ({
    red: p.red + c.red,
    green: p.green + c.green,
    blue: p.blue + c.blue,
});

const getAverageColourForPixelSquare = (pixelData: IPixelData[][]) => (square: ISquare) => {
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

const parseImageAtLocation = async (fileLocation: string) => {
    const pngData = await loadPngFromFileLocation(fileLocation);

    if (pngData === 'FAILURE') {
        return failure;
    }

    const gridLines = determineGridSize(pngData);
    const pixelSquares = gridLinesToPixelCoordinateSquares(gridLines);

    const pixelIsDark = (pixel: IPixelData) => pixel.red < 30
        && pixel.green < 30
        && pixel.blue < 30;


    const pixelGrid = pixelSquares
        .map(
            pixelSquareRow => pixelSquareRow.map(
                square => ({
                    ...square,
                    isDark: pixelIsDark(getAverageColourForPixelSquare(pngData)(square)),
                }),
            )
        )
        .map(
            pixelData => pixelData.map(x => x.isDark ? '1' : '.').join(''),
        )

    console.log(pixelGrid);

    return pixelGrid;
};



parseImageAtLocation('./images/image1.png').then(() => console.log('done'));



