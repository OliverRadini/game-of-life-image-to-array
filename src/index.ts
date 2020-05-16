import { determineGridSize, IPixelData, getAverageColourForPixelSquare, gridLinesToPixelCoordinateSquares } from "./imageTools";
import { loadPngFromFileLocation } from "./pngLoading";

const parseImageAtLocation = async (fileLocation: string) => {
    const imageData = await loadPngFromFileLocation(fileLocation);

    return imageData 
        .map(pngData => {
            const gridLines = determineGridSize(pngData);
            const pixelSquares = gridLinesToPixelCoordinateSquares(gridLines)

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
                    pixelData => pixelData.map(x => x.isDark ? 1 : 0)
                )

            return pixelGrid;
        })
        .getOrElse([]);
};

parseImageAtLocation(process.argv[2]).then(console.log).catch(console.error);



