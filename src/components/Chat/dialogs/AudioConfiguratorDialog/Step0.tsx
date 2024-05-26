import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import FileUploadButton from 'components/common/FileUploadButton';
import { decodeFileToAudioBuffer, useAudioContext } from 'helpers/AudioHelper';
import { fileToBlob } from 'helpers/Helper';
import { useAudioConfiguratorDialog } from '.';

import { styled } from '@mui/material/styles';

const Container = styled('div')`
    display: flex;
    justify-content: space-around;
    padding: 10px;
`;

// Select input type

const Step0: React.FC<IDialogPortal> = ({ contentId, actionsId }) => {
    const audioContext = useAudioContext();
    const { setStep, setAudioSource, setBlob, setOriginalAudioBuffer, setRanges } = useAudioConfiguratorDialog();
    const [isInitialized, setInitialized] = useState(false);

    useEffect(() => {
        setInitialized(true);
        setRanges([]);
        setAudioSource(null);
    }, []);

    const handleMicClick = async () => {
        setAudioSource('MIC');
        setStep(1);
    };

    const handleFileSelect = useCallback(
        async (file: File) => {
            if (!audioContext) return;
            const blob = await fileToBlob(file);
            const audioBuffer = await decodeFileToAudioBuffer(audioContext, blob);
            setBlob(blob);
            setOriginalAudioBuffer(audioBuffer);
            setAudioSource('FILE');
            setStep(2);
        },
        [audioContext]
    );

    if (!isInitialized) return <></>;

    const dialogContent = (
        <Container>
            <IconButton aria-label="chat" onClick={handleMicClick}>
                <MicIcon fontSize="inherit" />
            </IconButton>
            <FileUploadButton text="Upload file" variant="text" accept="audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/webm" onFileSelect={handleFileSelect} />
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
