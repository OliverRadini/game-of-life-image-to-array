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
        .map(x => x[1]);

    const indicesForHorizontalLines = pixelData
        .map(x => x[0])
        .map(matchesGridLinePixel)
        .map((matches, i) => [matches, i])
        .filter(x => x[0])
        .map(x => x[1]);
        

    return {
        indicesForVerticalLines,
        indicesForHorizontalLines,
    };
};

const parseImageAtLocation = async (fileLocation: string) => {
    const pngData = await loadPngFromFileLocation(fileLocation);

    if (pngData === 'FAILURE') {
        return failure;
    }

    console.log(determineGridSize(pngData));
    return pngData;
};

parseImageAtLocation('./images/image1.png').then(() => console.log('done'));



