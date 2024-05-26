import React, { ClipboardEvent, useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAddImageDialog } from '.';

import { styled } from '@mui/material/styles';
import { fileToBlob } from 'helpers/Helper';
import TextField from 'components/common/TextField';
import FileUploadButton from 'components/common/FileUploadButton';

const Container = styled('div')`
    display: flex;
    justify-content: space-around;
    padding: 10px;
`;

const Step0: React.FC<IDialogPortal> = ({ contentId, actionsId }) => {
    const { setStep, setBlob } = useAddImageDialog();
    const [isInitialized, setInitialized] = useState(false);

    useEffect(() => {
        setInitialized(true);
        setBlob(null);
    }, []);

    const handleFileSelect = useCallback(async (file: File) => {
        const blob = await fileToBlob(file);
        setBlob(blob);
        setStep(1);
    }, []);

    const handlePaste = async (event: ClipboardEvent<HTMLDivElement>) => {
        const items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image')) {
                const file = item.getAsFile();
                if (file) {
                    const blob = await fileToBlob(file);
                    setBlob(blob);
                    setStep(1);
                }
            }
        }
    };

    if (!isInitialized) return <></>;

    const dialogContent = (
        <Container>
            <TextField label="Paste from Clipboard here" onPaste={handlePaste} value={''} />
            <FileUploadButton text="Upload file" variant="text" accept="image/*" onFileSelect={handleFileSelect} />
        </Container>
    );

    const dialogActions = <> </>;

    return (
        <>
            {ReactDOM.createPortal(dialogContent, document.getElementById(contentId)!)}
            {ReactDOM.createPortal(dialogActions, document.getElementById(actionsId)!)}
        </>
    );
};

export default Step0;
