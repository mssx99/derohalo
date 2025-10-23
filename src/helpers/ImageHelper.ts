import Compressor from 'compressorjs';

export const compressImage = async <T extends File | Blob>(imageFileOrBlob: T, options: IImageOptions): Promise<T> => {
    const compressedFile = await new Promise<T>((resolve, reject) => {
        new Compressor(imageFileOrBlob, {
            ...options,
            convertTypes: ['image/png', 'image/webp'],

            success: async (compressedResult) => {
                resolve(compressedResult as T);
            },
            error(err) {
                reject(err);
            },
        });
    });

    return compressedFile;
};
