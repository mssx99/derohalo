export const getExtensionFromBlob = (blob: Blob): string => {
    console.log('getExtensionFromBlob', blob.type);
    const mimeTypesToExtension: { [key: string]: string } = {
        // Audio MIME types
        'audio/webm': '.webm',
        'audio/mpeg': '.mp3',
        'audio/ogg': '.ogg',
        'audio/wav': '.wav',
        'audio/x-wav': '.wav',
        'audio/vnd.wave': '.wav',
        // Video MIME types
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/ogg': '.ogv',
    };

    const extension = mimeTypesToExtension[blob.type];
    return extension || '';
};

export const downloadFile = (blobOrFile: Blob | File, filename?: string) => {
    if (!filename) {
        if (blobOrFile instanceof File) {
            filename = blobOrFile.name;
        } else {
            const isoDate = new Date().toISOString();
            const extension = getExtensionFromBlob(blobOrFile);
            filename = `file_${isoDate}${extension}`;
        }
    }
    const url = URL.createObjectURL(blobOrFile);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
};
