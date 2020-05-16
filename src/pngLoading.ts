import { createReadStream } from 'fs';
import { PNG } from 'pngjs';
import { Maybe, None, Just } from 'monet';
import { IPixelData } from './imageTools';
import { range } from './utils';

export const loadPngFromFileLocation = (location: string): Promise<Maybe<IPixelData[][]>> => new Promise((res, _) => {
    createReadStream(location)
        .pipe(new PNG())
        .on("parsed", function () {
            const laidOutData =  range(this.height).map(
                y => range(this.width)
                    .map(x => (this.width * y + x) << 2)
                    .map(index => ({
                        red: this.data[index],
                        green: this.data[index + 1],
                        blue: this.data[index + 2],
                    })) as IPixelData[]
            );

            res(Just(laidOutData));
            return;
        })
        .on("error", error => {
            console.error(error);
            res(None());
        });
});
