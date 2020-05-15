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

    const indicesForVerticalLines = pixelData[0]
        .map(matchesGridLinePixel)
        .map((matches, i) => [matches, i])
        .filter(x => x[0])
        .map(x => x[1]) as number[];

    const indicesForHorizontalLines = pixelData
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

const parseImageAtLocation = async (fileLocation: string) => {
    const pngData = await loadPngFromFileLocation(fileLocation);

    if (pngData === 'FAILURE') {
        return failure;
    }

    const gridLines = determineGridSize(pngData);
    const pixelSquares = gridLinesToPixelCoordinateSquares(gridLines);

    console.dir(pixelSquares);

    return pngData;
};

parseImageAtLocation('./images/image1.png').then(() => console.log('done'));



