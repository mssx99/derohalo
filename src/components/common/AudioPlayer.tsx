import React, { useEffect, useRef, useState, useCallback } from 'react';
import { base64ToBlob } from 'helpers/Helper';
import { styled } from '@mui/material/styles';
import { AudioVisualizer } from 'react-audio-visualize';

import IconButton from '@mui/material/IconButton';
import PlayIcon from '@mui/icons-material/PlayArrowSharp';
import PauseIcon from '@mui/icons-material/PauseSharp';
import { formatTimer } from 'helpers/FormatHelper';
import { decodeFileToAudioBuffer, useAudioContext } from 'helpers/AudioHelper';

interface IAudioPlayer {
    blob?: Blob;
    base64?: string;
    width?: number;
    height?: number;
}

const Container = styled('div')`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;

    & div:nth-of-type(1) {
        flex-grow: 1;
        flex-shrink: 1;
        min-width: 0;
    }
`;

const Holder = styled('div')`
    position: relative;
    display: flex;

    & canvas {
        flex-grow: 1;
        flex-shrink: 1;
        min-width: 0;
    }
`;

const TimerDiv = styled('div')`
    position: absolute;
    font-family: 'AlarmClock', sans-serif;
    font-size: 24px;
    left: 2px;
    bottom: 2px;
`;

const TimerTotalDiv = styled(TimerDiv)`
    font-size: 16px;
    left: auto;
    right: 2px;
`;

const AudioPlayer: React.FC<IAudioPlayer> = ({ blob, base64, width = 700, height = 75 }) => {
    const audioContext = useAudioContext();
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(source);

    const visualizerRef = useRef<HTMLCanvasElement>(null);
    const [sourceBlob, setSourceBlob] = useState<Blob | null>(null);

    const [elapsedTime, setElapsedTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const isPlayingRef = useRef(false);

    const stoppedManuallyRef = useRef<boolean>(false);
    const startTimeRef = useRef<number>(0);
    const startOffsetRef = useRef<number>(0);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
        sourceRef.current = source;
    }, [isPlaying, source]);

    useEffect(() => {
        let sourceBlob: Blob | null = null;

        if (blob) {
            sourceBlob = blob;
        } else if (base64) {
            sourceBlob = base64ToBlob(base64, 'audio/webm');
        }

        setSourceBlob(sourceBlob);
    }, [blob, base64]);

    useEffect(() => {
        if (!sourceBlob || !audioContext) return;
        decodeFileToAudioBuffer(audioContext, sourceBlob).then((audioBuffer: AudioBuffer) => {
            setElapsedTime(0);
            setTotalTime(audioBuffer.duration);
            setAudioBuffer(audioBuffer);
        });
    }, [audioContext, sourceBlob]);

    const report = useCallback(() => {
        if (audioContext && isPlayingRef.current) {
            const newElapsedTime = startOffsetRef.current + audioContext.currentTime - startTimeRef.current;
            setElapsedTime(newElapsedTime);
            requestAnimationFrame(report);
        }
    }, []);

    useEffect(() => {
        if (isPlaying) {
            report();
        }
    }, [isPlaying]);

    useEffect(() => {
        return () => {
            if (audioContext && source) {
                source.stop();
                source.disconnect();
            }
        };
    }, [source]);

    const handleStartPlayingClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();

            if (!audioContext || !audioBuffer === null) return;
            if (sourceRef.current) {
                sourceRef.current.stop();
                sourceRef.current.disconnect();
            }
            const newSource = audioContext.createBufferSource();
            newSource.buffer = audioBuffer;
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
        },
        [audioBuffer]
    );

    const handlePausePlayingClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            event.stopPropagation();

            if (!source) {
                return;
            }
            setIsPlaying(false);
            stoppedManuallyRef.current = true;
            startOffsetRef.current += audioContext!.currentTime - startTimeRef.current;
            source.stop();
            source.disconnect();
        },
        [source]
    );

    if (!audioContext) return <></>;

    return (
        <Container>
            <Holder>
                {sourceBlob && <AudioVisualizer ref={visualizerRef} blob={sourceBlob} width={width} height={height} barWidth={1} gap={0} barColor={'#f76565'} />}
                <TimerDiv className="blackTextShadow">{formatTimer(elapsedTime * 1000)}</TimerDiv>
                <TimerTotalDiv className="blackTextShadow">{formatTimer(totalTime * 1000)}</TimerTotalDiv>
            </Holder>
            {!isPlaying ? (
                <IconButton onClick={handleStartPlayingClick} aria-label="play" style={{ backgroundColor: 'red' }} disabled={!audioBuffer}>
                    <PlayIcon />
                </IconButton>
            ) : (
                <IconButton onClick={handlePausePlayingClick} aria-label="pause" style={{ backgroundColor: 'red' }}>
                    <PauseIcon />
                </IconButton>
            )}
        </Container>
    );
};

export default AudioPlayer;
