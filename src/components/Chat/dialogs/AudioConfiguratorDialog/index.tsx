import React, { useId, useEffect, useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Paper, { PaperProps } from '@mui/material/Paper';
import { styled } from '@mui/material/styles';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogCloseButton } from 'components/Main/Dialogs';
import { TransitionForDialog } from 'components/common/Transitions';
import { TransitionProps } from '@mui/material/transitions';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import Typography from '@mui/material/Typography';

import { create } from 'zustand';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

import Step0 from './Step0';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { MAX_AUDIO_SECONDS } from 'Constants';
import { getDefaultRanges } from 'helpers/AudioHelper';

const AUDIO_CONFIGURATOR_DIALOG_NAME = 'AudioConfiguratorDialog';

export type HoverTimeStore = {
    hoverTime: number;
    setHoverTime: (hoverTime: number) => void;
    editedRange: IAudioRange | null;
    setEditedRange: (editedRange: IAudioRange | null) => void;
};

export const useHoverTimeStore = create<HoverTimeStore>((set) => ({
    hoverTime: -1,
    setHoverTime: (hoverTime: number) => set({ hoverTime }),
    editedRange: null,
    setEditedRange: (editedRange: IAudioRange | null) => set({ editedRange }),
}));

export type AudioSourceType = 'MIC' | 'FILE' | null;

export type AudioConfiguratorStoreState = {
    isOpen: boolean;
    setOpen: (newOpen: boolean) => void;
    isRecording: boolean;
    setRecording: (isRecording: boolean) => void;
    originalAudioBuffer: AudioBuffer | null;
    setOriginalAudioBuffer: (originalAudioBuffer: AudioBuffer | null) => void;
    audioBuffer: AudioBuffer | null;
    setAudioBuffer: (audioBuffer: AudioBuffer | null) => void;
    blob: Blob | null;
    setBlob: (newBlob: Blob | null, isOpen?: boolean) => void;
    mediaRecorder: MediaRecorder | null;
    setMediaRecorder: (newMediaRecorder: MediaRecorder | null) => void;
    percentageProgress: number;
    setPercentageProgress: (newPercentage: number) => void;
    step: number;
    setStep: (newStep: number) => void;
    audioSource: AudioSourceType;
    setAudioSource: (audioSource: AudioSourceType) => void;
    ranges: IAudioRange[];
    addRange: (audioRange: IAudioRange, elapsedTime?: number) => void;
    removeRange: (id: string) => void;
    setRanges: (ranges: IAudioRange[]) => void;
    clear: () => void;
    elapsedTime: number;
    setElapsedTime: (elapsedTime: number) => void;
    playOnlySelected: boolean;
    setPlayOnlySelected: (playOnlySelected: boolean) => void;
    pause: () => void;
    play: () => void;
    jumpTo: (newTimeInSeconds: number) => void;
    setAudioFunctions: (pause: () => void, play: () => void, jumpTo: (newTime: number) => void) => void;
};

// export type PlaybackStateType="PLAYING"|"STOPPED"

export const useAudioConfiguratorStore = create<AudioConfiguratorStoreState>((set) => ({
    isOpen: false,
    setOpen: (isOpen) => set({ isOpen }),
    isRecording: false,
    setRecording: (isRecording: boolean) => set({ isRecording }),
    originalAudioBuffer: null,
    setOriginalAudioBuffer: (originalAudioBuffer: AudioBuffer | null) => set({ originalAudioBuffer, ranges: getDefaultRanges(originalAudioBuffer) }),
    audioBuffer: null,
    setAudioBuffer: (audioBuffer: AudioBuffer | null) => set({ audioBuffer }),
    blob: null,
    setBlob: (newBlob: Blob | null, isOpen: boolean = true) => set({ blob: newBlob, isOpen }),
    mediaRecorder: null,
    setMediaRecorder: (newMediaRecorder: MediaRecorder | null) => set({ mediaRecorder: newMediaRecorder }),
    percentageProgress: 0,
    setPercentageProgress: (newPercentage: number) => set({ percentageProgress: newPercentage }),
    step: 0,
    setStep: (newStep: number) => set({ step: newStep }),
    audioSource: null,
    setAudioSource: (audioSource: AudioSourceType) => set({ audioSource }),
    ranges: [],
    addRange: (newRange: IAudioRange, elapsedTime?: number) =>
        set((state) => ({ ranges: [...state.ranges.filter((r) => r.id !== newRange.id), { ...newRange }], elapsedTime: elapsedTime !== undefined ? elapsedTime : state.elapsedTime })),
    removeRange: (id: string) => set((state) => ({ ranges: state.ranges.filter((r, index, arr) => r.id !== id) })),
    setRanges: (ranges: IAudioRange[]) => set({ ranges }),
    clear: () => set({ step: 0, blob: null, mediaRecorder: null, percentageProgress: 0, ranges: [] }),
    elapsedTime: 0,
    setElapsedTime: (elapsedTime: number) => set({ elapsedTime }),
    playOnlySelected: false,
    setPlayOnlySelected: (playOnlySelected: boolean) => set({ playOnlySelected }),
    pause: () => {},
    play: () => {},
    jumpTo: (newTimeInSeconds: number) => {},
    setAudioFunctions: (pause: () => void, play: () => void, jumpTo: (newTimeInSeconds: number) => void) => set({ pause, play, jumpTo }),
}));

export const useAudioConfiguratorDialog = () => {
    const isOpen = useAudioConfiguratorStore((state) => state.isOpen);
    const setOpen = useAudioConfiguratorStore((state) => state.setOpen);
    const isRecording = useAudioConfiguratorStore((state) => state.isRecording);
    const setRecording = useAudioConfiguratorStore((state) => state.setRecording);
    const originalAudioBuffer = useAudioConfiguratorStore((state) => state.originalAudioBuffer);
    const setOriginalAudioBuffer = useAudioConfiguratorStore((state) => state.setOriginalAudioBuffer);
    const audioBuffer = useAudioConfiguratorStore((state) => state.audioBuffer);
    const setAudioBuffer = useAudioConfiguratorStore((state) => state.setAudioBuffer);
    const blob = useAudioConfiguratorStore((state) => state.blob);
    const setBlob = useAudioConfiguratorStore((state) => state.setBlob);
    const mediaRecorder = useAudioConfiguratorStore((state) => state.mediaRecorder);
    const setMediaRecorder = useAudioConfiguratorStore((state) => state.setMediaRecorder);
    const percentageProgress = useAudioConfiguratorStore((state) => state.percentageProgress);
    const setPercentageProgress = useAudioConfiguratorStore((state) => state.setPercentageProgress);
    const step = useAudioConfiguratorStore((state) => state.step);
    const setStep = useAudioConfiguratorStore((state) => state.setStep);
    const audioSource = useAudioConfiguratorStore((state) => state.audioSource);
    const setAudioSource = useAudioConfiguratorStore((state) => state.setAudioSource);
    const ranges = useAudioConfiguratorStore((state) => state.ranges);
    const addRange = useAudioConfiguratorStore((state) => state.addRange);
    const removeRange = useAudioConfiguratorStore((state) => state.removeRange);
    const setRanges = useAudioConfiguratorStore((state) => state.setRanges);
    const clear = useAudioConfiguratorStore((state) => state.clear);
    const elapsedTime = useAudioConfiguratorStore((state) => state.elapsedTime);
    const setElapsedTime = useAudioConfiguratorStore((state) => state.setElapsedTime);
    const playOnlySelected = useAudioConfiguratorStore((state) => state.playOnlySelected);
    const setPlayOnlySelected = useAudioConfiguratorStore((state) => state.setPlayOnlySelected);
    const pause = useAudioConfiguratorStore((state) => state.pause);
    const play = useAudioConfiguratorStore((state) => state.play);
    const jumpTo = useAudioConfiguratorStore((state) => state.jumpTo);
    const setAudioFunctions = useAudioConfiguratorStore((state) => state.setAudioFunctions);

    return {
        isOpen,
        setOpen,
        isRecording,
        setRecording,
        originalAudioBuffer,
        setOriginalAudioBuffer,
        audioBuffer,
        setAudioBuffer,
        blob,
        setBlob,
        mediaRecorder,
        setMediaRecorder,
        percentageProgress,
        setPercentageProgress,
        step,
        setStep,
        audioSource,
        setAudioSource,
        ranges,
        addRange,
        removeRange,
        setRanges,
        clear,
        elapsedTime,
        setElapsedTime,
        playOnlySelected,
        setPlayOnlySelected,
        play,
        pause,
        jumpTo,
        setAudioFunctions,
    };
};

const PaperWithElevation = (props: PaperProps) => <Paper {...props} elevation={5} />;

export const VisualizerBackground = styled(PaperWithElevation)`
    padding: 10px;
`;

interface StyledDialogActionsProps {
    step: number;
}

const StyledDialogActions = styled(DialogActions)<StyledDialogActionsProps>`
    ${(props) =>
        props.step === 4 &&
        `
    align-items: stretch;
    & div {
        display: flex;
        gap:10px;
    }
  `}
`;

const steps = ['Audio Source', 'Record Audio from Mic', 'Editor', 'Conversion', 'Send'];

const AudioConfiguratorDialog: React.FC = () => {
    const { isOpen, setOpen, step, setStep, audioSource } = useAudioConfiguratorDialog();
    const id_scrollDialogTitle = useId();
    const id_content = useId();
    const id_actions = useId();

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setStep]);

    const handleExit = () => {
        setStep(0);
    };

    const [currentScreen, setCurrentScreen] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        switch (step) {
            case 1:
                setCurrentScreen(<Step1 contentId={id_content} actionsId={id_actions} />);
                break;
            case 2:
                setCurrentScreen(<Step2 contentId={id_content} actionsId={id_actions} />);
                break;
            case 3:
                setCurrentScreen(<Step3 contentId={id_content} actionsId={id_actions} />);
                break;
            case 4:
                setCurrentScreen(<Step4 contentId={id_content} actionsId={id_actions} />);
                break;
            default:
                setCurrentScreen(<Step0 contentId={id_content} actionsId={id_actions} />);
                break;
        }
    }, [step]);

    const isStepOptional = (step: number) => {
        return step === 1;
    };

    const isStepSkipped = (step: number) => {
        if (step === 1 && audioSource === 'FILE') return true;
        return false;
    };

    return (
        <Dialog
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '51rem',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                    },
                },
            }}
            open={isOpen}
            onClose={handleClose}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            TransitionProps={{
                onExited: () => {
                    handleExit();
                },
            }}
            aria-labelledby={id_scrollDialogTitle}
        >
            <DialogTitle id={id_scrollDialogTitle}>Send Audio Message</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Stepper activeStep={step} style={{ marginBottom: '2rem' }}>
                    {steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        const labelProps: {
                            optional?: React.ReactNode;
                        } = {};

                        if (isStepOptional(index)) {
                            labelProps.optional = <Typography variant="caption">Optional</Typography>;
                        }
                        if (isStepSkipped(index)) {
                            stepProps.completed = false;
                        }

                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps}>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
                <div id={id_content}></div>
            </DialogContent>
            <StyledDialogActions step={step}>
                <Button onClick={handleClose}>Cancel</Button>
                <div id={id_actions}></div>
                {currentScreen}
            </StyledDialogActions>
        </Dialog>
    );
};

export default AudioConfiguratorDialog;
