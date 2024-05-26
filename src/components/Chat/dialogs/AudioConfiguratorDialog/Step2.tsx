import React, { useState, useRef, useCallback, useEffect, useId, useMemo } from 'react';
import ReactDOM from 'react-dom';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { AudioVisualizer } from 'react-audio-visualize';
import { VisualizerBackground, useAudioConfiguratorDialog, useAudioConfiguratorStore, useHoverTimeStore } from '.';
import {
    calcChangeInTimeAfterAddingRange,
    calcChangeInTimeAfterRemovingRange,
    convertAudioBufferToWebM,
    createAudioBufferFromRanges,
    getAudioDuration,
    netRange,
    translateAudioBufferTimeToOriginalTime,
    translateOriginalTimeToAudioBufferTime,
    useAudioContext,
} from 'helpers/AudioHelper';
import { MAX_AUDIO_SECONDS, MESSAGE_SEVERITY } from 'Constants';
import { nanoid } from 'nanoid';
import SwitchWithLabel from 'components/common/SwitchWithLabel';
import { formatTimer } from 'helpers/FormatHelper';
import TimerClock, { TotalClock } from './TimerClock';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { addSnackbar } from 'components/screen/Snackbars';
import { downloadFile } from 'helpers/FileHelper';
import { AudioOutOfBoundsError } from 'customErrors';
import HoverClock from './HoverClock';
import { usePrevious } from 'hooks/customHooks';

// Select Ranges

const Holder = styled('div')`
    position: relative;
`;

const Step2: React.FC<IDialogPortal> = ({ contentId, actionsId }) => {
    const visualizerRef = useRef<HTMLCanvasElement>(null);
    const { originalAudioBuffer, blob, audioBuffer, ranges, setStep } = useAudioConfiguratorDialog();
    const pointersId = useId();
    const controlsId = useId();

    const handleNextClick = () => {
        setStep(3);
    };

    const dialogContent = (
        <VisualizerBackground>
            <Holder>
                <AudioVisualizer ref={visualizerRef} blob={blob!} width={748} height={75} barWidth={1} gap={0} barColor={'#f76565'} />
                <EditLayer />
                <PointerContainer id={pointersId}></PointerContainer>
            </Holder>
            <Controls id={controlsId}></Controls>
            <AudioPlayer pointersId={pointersId} controlsId={controlsId} />
        </VisualizerBackground>
    );

    const dialogActions = (
        <Button onClick={handleNextClick} disabled={!audioBuffer || ranges.length === 0}>
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

const EditContainer = styled('div')`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
`;

const cleanRange = (audioRange: IAudioRange) => {
    return { id: audioRange.id, start: audioRange.start < audioRange.end ? audioRange.start : audioRange.end, end: audioRange.start < audioRange.end ? audioRange.end : audioRange.start };
};

const EditLayer: React.FC = () => {
    const { originalAudioBuffer, blob, ranges, addRange, removeRange, setRanges, playOnlySelected, pause, play, jumpTo } = useAudioConfiguratorDialog();
    const setHoverTime = useHoverTimeStore((state) => state.setHoverTime);
    const editedRange = useHoverTimeStore((state) => state.editedRange);
    const setEditedRange = useHoverTimeStore((state) => state.setEditedRange);

    const isDraggingRef = useRef(false);
    const startPosRef = useRef<{ x: number; positionInSeconds: number } | null>(null);
    const threshold = 3;

    const [duration, setDuration] = useState<number>(0);
    const editedRangeRef = useRef<IAudioRange | null>(null);
    editedRangeRef.current = editedRange;

    const getSecondsUsingPosition = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (!originalAudioBuffer) return -1;
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const positionInSeconds = (x / rect.width) * originalAudioBuffer.duration;
            return positionInSeconds;
        },
        [originalAudioBuffer]
    );

    const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button === 2) return;

        const positionInSeconds = getSecondsUsingPosition(event);

        startPosRef.current = { x: event.clientX, positionInSeconds };
        isDraggingRef.current = false;
    }, []);

    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const positionInSeconds = getSecondsUsingPosition(event);

        if (startPosRef.current) {
            if (!isDraggingRef.current) {
                const dx = event.clientX - startPosRef.current.x;

                if (Math.abs(dx) > threshold) {
                    isDraggingRef.current = true;
                }
            }

            if (isDraggingRef.current) {
                const isNegative = startPosRef.current.x > event.clientX;
                let start = isNegative ? positionInSeconds : startPosRef.current.positionInSeconds;
                let end = isNegative ? startPosRef.current.positionInSeconds : positionInSeconds;

                if (isNegative) {
                    startPosRef.current.positionInSeconds = end;
                    startPosRef.current.x = event.clientX;
                }

                if (!editedRangeRef.current) {
                    setEditedRange(cleanRange({ id: nanoid(), start, end }));
                } else {
                    setEditedRange(cleanRange({ id: editedRangeRef.current.id, start, end }));
                }
            }
        }

        setHoverTime(positionInSeconds);
    }, []);

    const handleMouseUp = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (event.button === 2) return;

            const positionInSeconds = getSecondsUsingPosition(event);

            if (isDraggingRef.current) {
                if (editedRangeRef.current) {
                    if (playOnlySelected) {
                        pause();
                        const currentElapsedTime = useAudioConfiguratorStore.getState().elapsedTime;
                        const newElapsedTime = calcChangeInTimeAfterAddingRange(ranges, editedRangeRef.current, currentElapsedTime);
                        if (currentElapsedTime != newElapsedTime) {
                            addRange(editedRangeRef.current);
                            jumpTo(newElapsedTime);
                        } else {
                            addRange(editedRangeRef.current);
                        }
                    } else {
                        addRange(editedRangeRef.current);
                    }
                }
                setEditedRange(null);
                startPosRef.current = null;
            } else {
                startPosRef.current = null;
                if (!originalAudioBuffer || (playOnlySelected && netRange(positionInSeconds, ranges) === -1)) return;
                if (playOnlySelected) {
                    jumpTo(netRange(positionInSeconds, ranges));
                } else {
                    jumpTo(positionInSeconds);
                }
            }
        },
        [originalAudioBuffer, jumpTo, ranges, playOnlySelected, pause]
    );

    useEffect(() => {
        setDuration(originalAudioBuffer?.duration ?? 0);
    }, [originalAudioBuffer]);

    const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
        const positionInSeconds = getSecondsUsingPosition(event);

        setHoverTime(positionInSeconds);
    };

    const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
        setHoverTime(-1);
    };

    return (
        <EditContainer id="editContainer" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {ranges.map((r) => (
                <Range key={r.id} value={r} />
            ))}
            {editedRange && <Range value={editedRange} />}
        </EditContainer>
    );
};

interface IRange {
    value: IAudioRange;
}

const RangeContainer = styled('div')`
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: #ffffff5e;
`;

const Range: React.FC<IRange> = ({ value }) => {
    const { originalAudioBuffer, removeRange, playOnlySelected, jumpTo, ranges, pause } = useAudioConfiguratorDialog();

    if (!originalAudioBuffer) return <></>;

    const handleRightClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();

            if (playOnlySelected) {
                pause();
                const currentElapsedTime = useAudioConfiguratorStore.getState().elapsedTime;
                const newElapsedTime = calcChangeInTimeAfterRemovingRange(ranges, value, currentElapsedTime);
                if (currentElapsedTime != newElapsedTime) {
                    removeRange(value.id);
                    jumpTo(newElapsedTime);
                } else {
                    removeRange(value.id);
                }
            } else {
                removeRange(value.id);
            }
        },
        [value, playOnlySelected, jumpTo, pause, removeRange, ranges]
    );

    const left = (value.start * 100) / originalAudioBuffer.duration + '%';
    const width = ((value.end - value.start) * 100) / originalAudioBuffer.duration + '%';
    return <RangeContainer style={{ left, width }} onContextMenu={handleRightClick}></RangeContainer>;
};

const PointerContainer = styled(EditContainer)`
    pointer-events: none;
`;

const Controls = styled('div')`
    display: flex;
    justify-content: space-around;
`;

interface IAudioPlayer {
    controlsId: string;
    pointersId: string;
}

const AudioPlayer: React.FC<IAudioPlayer> = ({ controlsId, pointersId }) => {
    const { originalAudioBuffer, audioBuffer, ranges, setElapsedTime, blob, setAudioBuffer, playOnlySelected, setPlayOnlySelected, setAudioFunctions } = useAudioConfiguratorDialog();
    const audioContext = useAudioContext();

    const [initialized, setInitialized] = useState(false);
    const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(source);

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const isPlayingRef = useRef<boolean>(isPlaying);

    const stoppedManuallyRef = useRef<boolean>(false);
    const startTimeRef = useRef<number>(0);
    const startOffsetRef = useRef<number>(0);
    const playOnlySelectedRef = useRef(playOnlySelected);
    const audioContextRef = useRef(audioContext);

    useEffect(() => {
        sourceRef.current = source;
        isPlayingRef.current = isPlaying;
        playOnlySelectedRef.current = playOnlySelected;
        audioContextRef.current = audioContext;
    }, [source, isPlayingRef, playOnlySelected, audioContext]);

    useEffect(() => {
        setInitialized(true);
        setElapsedTime(0);

        return () => {
            setIsPlaying(false);
            isPlayingRef.current = false;
            if (sourceRef.current) {
                sourceRef.current.stop();
                sourceRef.current.disconnect();
                setSource(null);
            }
        };
    }, []);

    const report = useCallback(() => {
        if (audioContextRef.current && isPlayingRef.current) {
            const newElapsedTime = startOffsetRef.current + audioContextRef.current.currentTime - startTimeRef.current;
            if (sourceRef.current?.buffer && sourceRef.current.buffer.duration >= newElapsedTime && isPlayingRef.current) {
                setElapsedTime(newElapsedTime);
            }
            requestAnimationFrame(report);
        }
    }, []);

    useEffect(() => {
        if (isPlaying) {
            report();
        }
    }, [isPlaying]);

    const pointers = (
        <PointerContainer>
            <Playhead />
            <HoverHead />
        </PointerContainer>
    );

    const handlePlayClick = useCallback(() => {
        if (!audioContext || (!playOnlySelected && originalAudioBuffer === null) || (playOnlySelected && audioBuffer === null)) return;
        if (sourceRef.current) {
            sourceRef.current.stop();
            sourceRef.current.disconnect();
        }
        const newSource = audioContext.createBufferSource();
        newSource.buffer = playOnlySelected ? audioBuffer : originalAudioBuffer;
        newSource.connect(audioContext.destination);
        setSource(newSource);
        setIsPlaying(true);
        stoppedManuallyRef.current = false;
        newSource.start(0, startOffsetRef.current);
        startTimeRef.current = audioContext.currentTime;
        newSource.onended = () => {
            setIsPlaying(false);
            isPlayingRef.current = false;
            if (!stoppedManuallyRef.current) {
                startOffsetRef.current = 0;
                setElapsedTime(0);
                newSource.disconnect();
            }
        };
    }, [playOnlySelected, source, originalAudioBuffer, audioBuffer]);

    const handlePauseClick = useCallback(() => {
        if (!source) {
            return;
        }
        setIsPlaying(false);
        stoppedManuallyRef.current = true;
        startOffsetRef.current += audioContext!.currentTime - startTimeRef.current;
        source.stop();
        source.disconnect();
    }, [source]);

    const jumpTo = useCallback(
        (newTimeInSeconds: number) => {
            if (newTimeInSeconds === -1) return;
            startOffsetRef.current = newTimeInSeconds;
            if (sourceRef.current) {
                sourceRef.current.onended = null;
            }
            if (isPlayingRef.current) {
                handlePlayClick();
            } else {
                setElapsedTime(newTimeInSeconds);
            }
        },
        [handlePlayClick]
    );

    useEffect(() => {
        setAudioFunctions(handlePauseClick, handlePlayClick, jumpTo);
    }, [setAudioFunctions, handlePauseClick, handlePlayClick, jumpTo]);

    const handleDownloadClick = useCallback(async () => {
        if (!audioContext) {
            addSnackbar({ message: 'No AudioContext.', severity: MESSAGE_SEVERITY.ERROR });
            return;
        }
        if (!playOnlySelected) {
            if (!blob) {
                addSnackbar({ message: 'No blob', severity: MESSAGE_SEVERITY.ERROR });
                return;
            }
            downloadFile(blob);
            return;
        } else {
            setBusyBackdrop(true, 'Converting selected section to webM, please hold on....');
            try {
                const nblob = await convertAudioBufferToWebM(audioContext, audioBuffer!);
                downloadFile(nblob);
            } catch (e) {
                addSnackbar({ message: 'An error happened converting...', severity: MESSAGE_SEVERITY.ERROR });
            } finally {
                setBusyBackdrop(false);
            }
        }
    }, [audioContext, playOnlySelected, originalAudioBuffer, audioBuffer, blob]);

    useEffect(() => {
        setAudioBuffer(null);
        if (!audioContext || !originalAudioBuffer) return;
        if (ranges.length === 0) {
            setPlayOnlySelected(false);
            setElapsedTime(0);
            return;
        }
        const newAudioBuffer = createAudioBufferFromRanges(audioContext, originalAudioBuffer, ranges);
        setAudioBuffer(newAudioBuffer);
    }, [audioContext, originalAudioBuffer, ranges]);

    const handleSwitchChanged = useCallback(
        (playOnlySelected: boolean) => {
            const elapsedTime = useAudioConfiguratorStore.getState().elapsedTime;
            if (playOnlySelected) {
                if (!originalAudioBuffer || !audioBuffer || ranges.length === 0) return;
                try {
                    jumpTo(translateOriginalTimeToAudioBufferTime(originalAudioBuffer, audioBuffer, ranges, elapsedTime));
                } catch (e) {
                    if (e instanceof AudioOutOfBoundsError) {
                        jumpTo(e.newPosition);
                    }
                }
            } else {
                if (!originalAudioBuffer || !audioBuffer) return;
                jumpTo(translateAudioBufferTimeToOriginalTime(originalAudioBuffer, audioBuffer, ranges, elapsedTime));
            }
            setPlayOnlySelected(playOnlySelected);
        },
        [originalAudioBuffer, audioBuffer, ranges]
    );

    const controls = (
        <>
            <TimerContainer>
                <TimerClock />
                <TotalClock />
            </TimerContainer>
            <SwitchWithLabel label="Play only selection " checked={playOnlySelected} onChange={handleSwitchChanged} disabled={!audioBuffer || ranges.length === 0} />
            {!isPlaying && <Button onClick={handlePlayClick}>Play</Button>}
            {isPlaying && <Button onClick={handlePauseClick}>Pause</Button>}
            <Button onClick={handleDownloadClick} disabled={!audioBuffer || ranges.length === 0}>
                Download
            </Button>
        </>
    );

    let screen = <></>;

    if (!audioContext) return screen;

    if (initialized) {
        screen = (
            <>
                {ReactDOM.createPortal(pointers, document.getElementById(pointersId)!)}
                {ReactDOM.createPortal(controls, document.getElementById(controlsId)!)}
            </>
        );
    }

    return screen;
};

const TimerContainer = styled('div')`
    flex-basis: 100px;
`;

const Bar = styled('div')`
    position: absolute;
    top: 0;
    left: 25%;
    width: 2px;
    bottom: 0;
    background-color: white;
    transform: translateX(-1px);
`;

const Playhead: React.FC = () => {
    const { originalAudioBuffer, audioBuffer, ranges, elapsedTime, playOnlySelected, jumpTo } = useAudioConfiguratorDialog();

    const [percentage, setPercentage] = useState<number>(0);
    const audioBufferUpdatePendingRef = useRef<boolean>(false);

    const prevAudioBuffer = usePrevious(audioBuffer);
    const prevRanges = usePrevious(ranges);

    useEffect(() => {
        if (playOnlySelected) {
            if (prevRanges !== ranges) {
                audioBufferUpdatePendingRef.current = true;
                return;
            }

            if (audioBufferUpdatePendingRef.current && prevAudioBuffer !== audioBuffer) {
                audioBufferUpdatePendingRef.current = false;
            }

            if (!originalAudioBuffer || !audioBuffer || ranges.length === 0) {
                setPercentage(0);
                return;
            }
            try {
                const timeInOriginal = translateAudioBufferTimeToOriginalTime(originalAudioBuffer, audioBuffer, ranges, elapsedTime);
                setPercentage((timeInOriginal * 100) / originalAudioBuffer!.duration);
            } catch (e) {
                if (e instanceof AudioOutOfBoundsError) {
                    console.log('Audio out of bounds in useeffect', e.newPosition);
                    jumpTo(e.newPosition);
                }
            }
        } else {
            if (!originalAudioBuffer) {
                setPercentage(0);
                return;
            }
            setPercentage((elapsedTime * 100) / originalAudioBuffer.duration);
        }
    }, [originalAudioBuffer, audioBuffer, ranges, elapsedTime, playOnlySelected]);

    return <Bar style={{ left: percentage + '%' }}></Bar>;
};

const SemiTransparentBar = styled(Bar)`
    background-color: #857dffa6;
`;

const HoverHead: React.FC = () => {
    const { originalAudioBuffer, playOnlySelected, ranges } = useAudioConfiguratorDialog();
    const rangesRef = useRef<IAudioRange[]>(ranges);

    const hoverTime = useHoverTimeStore((state) => state.hoverTime);
    const hoverTimeRef = useRef(hoverTime);

    const animationFrameId = useRef<number>(0);
    const [percentage, setPercentage] = useState<number>(-1);
    const [netTime, setNetTime] = useState<number>(-1);

    useEffect(() => {
        rangesRef.current = ranges;
        hoverTimeRef.current = hoverTime;
    }, [ranges, hoverTime]);

    const report = useCallback(() => {
        if (!originalAudioBuffer) {
            setPercentage(-1);
            return;
        }
        const ht = hoverTimeRef.current;
        setPercentage((ht / originalAudioBuffer.duration) * 100);
        if (playOnlySelected) {
            const nt = netRange(ht, rangesRef.current);
            setNetTime(nt);
        }
        animationFrameId.current = 0;
    }, [originalAudioBuffer, playOnlySelected]);

    useEffect(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        animationFrameId.current = requestAnimationFrame(report);
    }, [originalAudioBuffer, hoverTime]);

    if (percentage < 0 || (playOnlySelected && netTime < 0)) return <></>;

    return (
        <SemiTransparentBar style={{ left: percentage + '%' }}>
            <HoverClock hoverTime={playOnlySelected ? netTime : hoverTime} />
        </SemiTransparentBar>
    );
};

export default Step2;
