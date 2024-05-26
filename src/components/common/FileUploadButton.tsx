import React, { useRef } from 'react';
import Button from '@mui/material/Button';
import { nanoid } from 'nanoid';

interface IFileUploadButton {
    text?: string;
    variant?: 'text' | 'contained' | 'outlined' | undefined;
    accept?: string;
    onFileSelect: (file: File) => void;
}

const FileUploadButton: React.FC<IFileUploadButton> = ({ text, variant = 'contained', accept = '*/*', onFileSelect }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    if (!text) {
        text = 'Upload File';
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const filesObject = event?.target?.files;
        if (filesObject) {
            const file = filesObject[0];
            onFileSelect(file);
        }
    };

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <>
            <input ref={inputRef} accept={accept} style={{ display: 'none' }} multiple type="file" onChange={handleFileChange} />
            <Button variant={variant} component="label" onClick={handleButtonClick}>
                {text}
            </Button>
        </>
    );
};

export default FileUploadButton;
