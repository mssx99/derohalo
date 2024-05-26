import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Button from '@mui/material/Button';
import LinearProgressWithLabel from 'components/common/LinearProgressWithLabel';
import { useAudioConfiguratorDialog } from '.';
import { convertAudioBufferToWebM, useAudioContext } from 'helpers/AudioHelper';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';

// Converting Message to WebM

const Step3: React.FC<IDialogPortal> = ({ contentId, actionsId }) => {
    const { audioBuffer, setStep, setBlob } = useAudioConfiguratorDialog();
    const audioContext = useAudioContext();
    const [progress, setProgress] = useState<number>(0);

    const handleStopConversionClick = useCallback(() => {
        setStep(2);
    }, [setStep]);

    useEffect(() => {
        if (!audioContext || !audioBuffer) return;
        let active = true;
        const cancelContainer: { cancel: (() => void) | null } = { cancel: () => {} };
        const setCancel = (cancel: (() => void) | null) => {
            cancelContainer.cancel = cancel;
        };
        convertAudioBufferToWebM(audioContext, audioBuffer!, setProgress, setCancel, 8000)
            .then((blob) => {
                if (active) {
                    setBlob(blob);
                    setStep(4);
                }
            })
            .catch((e) => {
                if (active) {
                    console.error(e);
                    addSnackbar({ message: 'Error converting:' + e.message, severity: MESSAGE_SEVERITY.ERROR });
                }
            });
        return () => {
            active = false;
            if (cancelContainer.cancel) {
                cancelContainer.cancel();
            }
        };
    }, [audioContext, audioBuffer]);

    const dialogContent = (
        <>
            <LinearProgressWithLabel value={progress} />
        </>
    );

    const dialogActions = <Button onClick={handleStopConversionClick}>Stop Conversion</Button>;

    return (
        <>
            {ReactDOM.createPortal(dialogContent, document.getElementById(contentId)!)}
            {ReactDOM.createPortal(dialogActions, document.getElementById(actionsId)!)}
        </>
    );
};

export default Step3;
