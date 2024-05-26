import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import Button from '@mui/material/Button';
import MyLiveAudioVisualizer from './MyLiveAudioVisualizer';
import { useMicrophone } from 'helpers/AudioHelper';
import { VisualizerBackground, useAudioConfiguratorDialog } from '.';

import { styled } from '@mui/material/styles';
import { formatTimer } from 'helpers/FormatHelper';
import TimerClock from './TimerClock';

import IconButton from '@mui/material/IconButton';
import RecordIcon from '@mui/icons-material/PlayArrowSharp';
import PauseIcon from '@mui/icons-material/PauseSharp';

// Capture Sound from Mic

const ControlContainer = styled('div')`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: right;
    gap: 10px;
`;

const Step1: React.FC<IDialogPortal> = ({ contentId, actionsId }) => {
    const { isRecording, mediaRecorder, setRecording, setStep, elapsedTime, setElapsedTime } = useAudioConfiguratorDialog();

    useMicrophone();

    useEffect(() => {
        setElapsedTime(0);
    }, []);

    const handleStartRecordingClick = useCallback(() => {
        if (!mediaRecorder) return;
        setRecording(true);
        mediaRecorder.resume();
    }, [mediaRecorder]);

    const handlePauseRecordingClick = useCallback(() => {
        if (!mediaRecorder) return;
        setRecording(false);
        mediaRecorder!.pause();
    }, [mediaRecorder]);

    const handleStopRecordingClick = useCallback(() => {
        if (!mediaRecorder) return;
        setRecording(false);
        mediaRecorder!.stop();
    }, [mediaRecorder]);

    if (!mediaRecorder) return <Button>Next</Button>;

    const dialogContent = (
        <VisualizerBackground>
            <MyLiveAudioVisualizer mediaRecorder={mediaRecorder} width={748} height={75} />
            <ControlContainer>
                <Timer />

                {!isRecording ? (
                    <IconButton onClick={handleStartRecordingClick} aria-label="record" style={{ backgroundColor: 'red' }}>
                        <RecordIcon />
                    </IconButton>
                ) : (
                    <IconButton onClick={handlePauseRecordingClick} aria-label="pause" style={{ backgroundColor: 'red' }}>
                        <PauseIcon />
                    </IconButton>
                )}
            </ControlContainer>
        </VisualizerBackground>
    );

    const dialogActions = (
        <Button onClick={handleStopRecordingClick} disabled={elapsedTime === 0}>
            Next
        </Button>
    );

    return (
        <>
            {ReactDOM.createPortal(dialogContent, document.getElementById(contentId)!)}
            {ReactDOM.createPortal(dialogActions, document.getElementById(actionsId)!)}
        </>
    );
};

const Timer: React.FC = () => {
    const { isRecording, setElapsedTime } = useAudioConfiguratorDialog();
    const isRecordingRef = useRef<boolean>(false);
    const msRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    const report = useCallback(() => {
        const newMs = Date.now() - startTimeRef.current;
        if (isRecordingRef.current) {
            setElapsedTime((msRef.current + newMs) / 1000);
            requestAnimationFrame(report);
        } else {
            msRef.current += newMs;
        }
    }, [isRecording]);

    useEffect(() => {
        isRecordingRef.current = isRecording;
        if (isRecording) {
            startTimeRef.current = Date.now();
            report();
        }
    }, [isRecording]);

    return <TimerClock isMicrophoneRecording />;
};

export default Step1;
