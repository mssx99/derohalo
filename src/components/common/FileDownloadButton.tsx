import React from 'react';
import Button from '@mui/material/Button';

interface IFileDownloadButton {
    text?: string;
    createData: () => string;
    filename: string;
    mimeType?: string;
    variant?: 'text' | 'contained' | 'outlined' | undefined;
}

const FileDownloadButton: React.FC<IFileDownloadButton> = ({ text, createData, filename, mimeType = 'text/plain', variant = 'contained' }) => {
    if (!text) {
        text = 'Download File';
    }
    const handleDownload = () => {
        const content = createData();
        const blob = new Blob([content], { type: mimeType });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    };

    return (
        <Button variant={variant} color="primary" onClick={handleDownload}>
            {text}
        </Button>
    );
};

export default FileDownloadButton;
