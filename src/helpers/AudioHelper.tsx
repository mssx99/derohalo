import { useAudioConfiguratorStore } from 'components/Chat/dialogs/AudioConfiguratorDialog';
import { useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { addSnackbar } from 'components/screen/Snackbars';
import { AUDIO_CHAT_QUALITY, MAX_AUDIO_SECONDS, MESSAGE_SEVERITY } from 'Constants';
import { AudioContextNotAvailableError, AudioOutOfBoundsError } from 'customErrors';
import { create } from 'zustand';

declare global {
    interface Window {
        audioContext?: AudioContext;
    }
}

export type AudioContextStore = {
    audioContext: AudioContext | null;
    setAudioContext: (audioContext: AudioContext | null) => void;
    isCreatingAudioContext: boolean;
    setIsCreatingAudioContext: (isCreating: boolean) => void;
};

export const useAudioContextStore = create<AudioContextStore>((set) => ({
    audioContext: null,
    setAudioContext: (audioContext: AudioContext | null) => set({ audioContext }),
    isCreatingAudioContext: false,
    setIsCreatingAudioContext: (isCreating: boolean) => set({ isCreatingAudioContext: isCreating }),
}));

export const getAudioContext = () => {
    const audioContext = useAudioContextStore.getState().audioContext;
    if (!audioContext) throw new AudioContextNotAvailableError();
    return audioContext;
};

export const useAudioContext = () => {
    const audioContext = useAudioContextStore((state) => state.audioContext);
    const setAudioContext = useAudioContextStore((state) => state.setAudioContext);
    const isCreatingAudioContext = useAudioContextStore((state) => state.isCreatingAudioContext);
    const setIsCreatingAudioContext = useAudioContextStore((state) => state.setIsCreatingAudioContext);

    useEffect(() => {
        if (audioContext || isCreatingAudioContext) return;

        const handleFirstInteraction = (event: MouseEvent) => {
            if (!audioContext && !isCreatingAudioContext && event.isTrusted) {
                setIsCreatingAudioContext(true);
                const newAudioContext = new AudioContext();
                newAudioContext.resume().then(() => {
                    setAudioContext(newAudioContext);
                    setIsCreatingAudioContext(false);
                    document.removeEventListener('click', handleFirstInteraction);
                });
            }
        };

        document.addEventListener('click', handleFirstInteraction);
        return () => {
            document.removeEventListener('click', handleFirstInteraction);
        };
    }, [audioContext, isCreatingAudioContext, setAudioContext, setIsCreatingAudioContext]);

    return audioContext;
};

export const useMicrophone = () => {
    const audioContext = useAudioContext();
    useEffect(() => {
        if (!audioContext) return;
        let active = true;
        let activeStream: MediaStream | null = null;
        let mediaRecorder: MediaRecorder | null = null;

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                if (!active) {
                    closeMicrophone(stream);
                    return;
                }
                activeStream = stream;
                const { setMediaRecorder, setBlob, setOriginalAudioBuffer, setStep } = useAudioConfiguratorStore.getState();

                console.log('start Microphone');
                mediaRecorder = new MediaRecorder(activeStream);
                setMediaRecorder(mediaRecorder);

                mediaRecorder.start();
                mediaRecorder.pause();

                mediaRecorder.ondataavailable = async (e) => {
                    if (!active) return;
                    if (e.data.size > 0) {
                        const audioBlob = new Blob([e.data], { type: 'audio/wav' });
                        const audioBuffer = await decodeFileToAudioBuffer(audioContext, audioBlob);

                        setOriginalAudioBuffer(audioBuffer);
                        setBlob(audioBlob);
                        setStep(2);
                    } else {
                        setStep(0);
                    }

                    closeMicrophone(activeStream, mediaRecorder);
                };
            })
            .catch((e) => {
                if (!active) {
                    return;
                }
                console.error(e);
                addSnackbar({ message: 'No microphone.', severity: MESSAGE_SEVERITY.ERROR });
                useAudioConfiguratorStore.getState().setStep(0);
            });

        return () => {
            active = false;
            closeMicrophone(activeStream, mediaRecorder);
        };
    }, [audioContext]);
};

const closeMicrophone = (stream?: MediaStream | null, mediaRecorder?: MediaRecorder | null) => {
    mediaRecorder?.stop();
    useAudioConfiguratorStore.getState().setMediaRecorder(null);
    stream?.getTracks().forEach((track) => track.stop());
};

export const getDefaultRanges = (originalAudioBuffer: AudioBuffer | null): IAudioRange[] => {
    if (!originalAudioBuffer) return [];
    return [{ id: nanoid(), start: 0, end: Math.min(MAX_AUDIO_SECONDS, originalAudioBuffer.duration) }];
};

export const getAudioBufferFromBlob = async (audioContext: AudioContext, audioBlob: Blob): Promise<AudioBuffer> => {
    try {
        const arrayBuffer: ArrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer: AudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const convertAudioBufferToWebM = (
    audioContext: AudioContext,
    audioBuffer: AudioBuffer,
    setProgress?: React.Dispatch<React.SetStateAction<number>>,
    setCancel?: React.Dispatch<(() => void) | null>,
    audioBitsPerSecond?: number
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const { setMediaRecorder } = useAudioConfiguratorStore.getState();

        let recorder: MediaRecorder;
        let progressInterval: number | undefined;
        let isCancelled = false;

        try {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;

            source.connect(audioContext.destination);

            const dest = audioContext.createMediaStreamDestination();
            source.connect(dest);

            recorder = new MediaRecorder(dest.stream, {
                mimeType: 'audio/webm; codecs=opus',
                audioBitsPerSecond,
            });

            let chunks: BlobPart[] = [];
            let startTime: number = Date.now();
            let duration: number = audioBuffer.duration * 1000;

            recorder.ondataavailable = (e: BlobEvent) => {
                if (isCancelled) {
                    return;
                }
                chunks.push(e.data);
            };

            recorder.onstop = () => {
                if (isCancelled) {
                    return;
                }
                if (setProgress) {
                    setProgress(100);
                }
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setMediaRecorder(null);
                resolve(blob);
            };

            recorder.onerror = (event: Event) => {
                const errorEvent = event as unknown as { error: DOMException };
                reject(errorEvent.error);
            };

            setMediaRecorder(recorder);

            if (!isCancelled) {
                recorder.start();
                source.start();

                if (setProgress) {
                    progressInterval = window.setInterval(() => {
                        let elapsedTime: number = Date.now() - startTime;
                        let progress: number = Math.min((elapsedTime / duration) * 100, 100);
                        setProgress(progress);
                    }, 1000);
                }

                source.onended = () => {
                    recorder.stop();
                    if (progressInterval !== undefined) {
                        clearInterval(progressInterval);
                    }
                };

                if (setCancel) {
                    setCancel(() => {
                        isCancelled = true;
                        if (source) {
                            source.stop();
                            source.disconnect();
                        }
                        recorder.stop();
                        if (progressInterval !== undefined) {
                            clearInterval(progressInterval);
                        }
                        reject(new Error('Recording cancelled.'));
                    });
                }
            }
        } catch (e) {
            console.error(e);
            reject(e);
        }
    });
};

export const decodeFileToAudioBuffer = async (audioContext: AudioContext, file: File | Blob): Promise<AudioBuffer> => {
    const arrayBuffer = await file.arrayBuffer();

    return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
                resolve(audioBuffer);
            },
            (error) => {
                console.error('Error decoding audio data', error);
                reject(error);
            }
        );
    });
};

export const getAudioDuration = (file: File | Blob): Promise<number> => {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.onloadedmetadata = () => {
            console.log(audio);
            resolve(audio.duration);
        };
        audio.onerror = () => {
            reject('Error loading audio file.');
        };
        audio.src = URL.createObjectURL(file);

        audio.onended = () => {
            URL.revokeObjectURL(audio.src);
        };
    });
};

export const createAudioBufferFromRanges = (audioContext: AudioContext, originalAudioBuffer: AudioBuffer, ranges: IAudioRange[]): AudioBuffer | null => {
    const adjustRanges = (ranges: IAudioRange[], bufferDuration: number): IAudioRange[] => {
        return ranges.map((range) => ({
            ...range,
            start: Math.max(0, range.start),
            end: Math.min(bufferDuration, range.end),
        }));
    };

    const adjustedRanges = adjustRanges(ranges, originalAudioBuffer.duration);

    const mergedRanges = mergeRanges(adjustedRanges);

    const totalLength = mergedRanges.reduce((acc, range) => acc + (range.end - range.start), 0);

    if (totalLength === 0) return null;

    const byteLength = mergedRanges.reduce((acc, range) => {
        const startOffset = Math.floor(range.start * originalAudioBuffer.sampleRate);
        const endOffset = Math.floor(range.end * originalAudioBuffer.sampleRate);
        const rangeLength = endOffset - startOffset;

        return acc + rangeLength;
    }, 0);

    const combinedAudioBuffer = audioContext.createBuffer(originalAudioBuffer.numberOfChannels, byteLength, originalAudioBuffer.sampleRate);

    let currentOffset = 0;

    mergedRanges.forEach((range) => {
        const startOffset = Math.floor(range.start * originalAudioBuffer.sampleRate);
        const endOffset = Math.floor(range.end * originalAudioBuffer.sampleRate);
        const rangeLength = endOffset - startOffset;

        for (let channel = 0; channel < originalAudioBuffer.numberOfChannels; channel++) {
            const originalBufferData = originalAudioBuffer.getChannelData(channel);
            const rangeData = originalBufferData.subarray(startOffset, endOffset);
            combinedAudioBuffer.getChannelData(channel).set(rangeData, currentOffset);
        }

        currentOffset += rangeLength;
    });

    return combinedAudioBuffer;
};

export const getTotalSelectedTime = (ranges: IAudioRange[]) => {
    const mergedRanges = mergeRanges(ranges);
    return mergedRanges.reduce((acc, range) => acc + (range.end - range.start), 0);
};

const mergeRanges = (ranges: IAudioRange[]): IAudioRange[] => {
    if (!ranges.length) return [];

    ranges.sort((a, b) => a.start - b.start);

    const mergedRanges: IAudioRange[] = [ranges[0]];

    for (let i = 1; i < ranges.length; i++) {
        const lastRange = mergedRanges[mergedRanges.length - 1];
        const currentRange = ranges[i];

        if (currentRange.start <= lastRange.end) {
            lastRange.end = Math.max(lastRange.end, currentRange.end);
        } else {
            mergedRanges.push(currentRange);
        }
    }

    return mergedRanges;
};

export const isInRanges = (time: number, ranges: IAudioRange[]): boolean => {
    return ranges.some((range) => time >= range.start && time <= range.end);
};

export const netRange = (hoverTime: number, ranges: IAudioRange[]): number => {
    // Sort the ranges by their start time
    ranges.sort((a, b) => a.start - b.start);

    let netTime = 0;
    let currentTime = 0;

    for (const range of ranges) {
        if (hoverTime < range.start) {
            // If hoverTime is less than the start of the current range, it's outside
            return -1;
        } else if (hoverTime <= range.end) {
            // If hoverTime is within the current range, calculate the net time
            netTime += Math.min(hoverTime, range.end) - Math.max(currentTime, range.start);
            return netTime;
        } else {
            // Update netTime and currentTime considering overlaps
            netTime += range.end - Math.max(currentTime, range.start);
            currentTime = Math.max(currentTime, range.end);
        }
    }

    // If hoverTime is greater than all the ranges, it's outside
    return -1;
};

export const calcChangeInTimeAfterAddingRange = (ranges: IAudioRange[], newRange: IAudioRange, currentElapsedSeconds: number) => {
    console.log(currentElapsedSeconds);

    const oldRanges = sortAndMergeRanges(ranges);
    const newRanges = sortAndMergeRanges([...ranges, newRange]);

    let remainingTime = currentElapsedSeconds;
    let oldOriginalTime = 0;
    for (const range of oldRanges) {
        if (remainingTime > 0) {
            if (range.end - range.start < remainingTime) {
                remainingTime -= range.end - range.start;
            } else {
                oldOriginalTime = range.start + remainingTime;
                remainingTime = 0;
                break;
            }
        }
    }

    if (newRange.start > oldOriginalTime) {
        return currentElapsedSeconds;
    }

    let newRangesElapsedTimeNecessary = 0;
    for (const range of newRanges) {
        if (oldOriginalTime > range.end) {
            newRangesElapsedTimeNecessary += range.end - range.start;
        } else if (oldOriginalTime > range.start) {
            newRangesElapsedTimeNecessary += oldOriginalTime - range.start;
        }
    }

    return newRangesElapsedTimeNecessary;
};

export const calcChangeInTimeAfterRemovingRange = (ranges: IAudioRange[], removedRange: IAudioRange, currentElapsedSeconds: number) => {
    console.log(currentElapsedSeconds);

    const oldRanges = sortAndMergeRanges(ranges);
    const newRanges = sortAndMergeRanges(ranges.filter((r) => r.id !== removedRange.id));

    let remainingTime = currentElapsedSeconds;
    let oldOriginalTime = 0;
    for (const range of oldRanges) {
        if (remainingTime > 0) {
            if (range.end - range.start < remainingTime) {
                remainingTime -= range.end - range.start;
            } else {
                oldOriginalTime = range.start + remainingTime;
                remainingTime = 0;
                break;
            }
        }
    }

    if (removedRange.start > oldOriginalTime) {
        return currentElapsedSeconds;
    }

    let newRangesElapsedTimeNecessary = 0;
    for (const range of newRanges) {
        if (oldOriginalTime > range.end) {
            newRangesElapsedTimeNecessary += range.end - range.start;
        } else if (oldOriginalTime > range.start) {
            newRangesElapsedTimeNecessary += oldOriginalTime - range.start;
        }
    }

    return newRangesElapsedTimeNecessary;
};

export const translateOriginalTimeToAudioBufferTime = (originalAudioBuffer: AudioBuffer, audioBuffer: AudioBuffer, ranges: IAudioRange[], originalTime: number): number => {
    if (originalTime < 0 || originalTime > originalAudioBuffer.duration || ranges.length === 0) {
        throw new Error('Original time is out of bounds.');
    }

    const sortedMergedRanges = sortAndMergeRanges(ranges);

    let audioBufferTime = 0;
    let timeProcessed = 0;

    for (const range of sortedMergedRanges) {
        const clampedStart = Math.max(0, range.start);
        const clampedEnd = Math.min(originalAudioBuffer.duration, range.end);

        if (originalTime >= clampedStart && originalTime < clampedEnd) {
            audioBufferTime += originalTime - clampedStart + timeProcessed;
            break;
        } else if (originalTime >= clampedEnd) {
            timeProcessed += clampedEnd - clampedStart;
        }
    }

    return audioBufferTime;
};

export const translateAudioBufferTimeToOriginalTime = (originalAudioBuffer: AudioBuffer, audioBuffer: AudioBuffer, ranges: IAudioRange[], audioBufferTime: number): number => {
    if (ranges.length === 0) {
        throw new Error('No range defined.');
    }

    const sortedMergedRanges = sortAndMergeRanges(ranges);

    if (audioBufferTime < 0 || audioBufferTime > audioBuffer.duration) {
        const start = sortedMergedRanges[0].start;
        console.log('SETTING TO START BY AUDIOOUTOFBOUNDSERROR', start, ranges);
        throw new AudioOutOfBoundsError(start);
    }

    let originalTime = 0;
    let timeProcessed = 0;

    for (const range of sortedMergedRanges) {
        const clampedStart = Math.max(0, range.start);
        const clampedEnd = Math.min(originalAudioBuffer.duration, range.end);
        const rangeDuration = clampedEnd - clampedStart;

        if (audioBufferTime < timeProcessed + rangeDuration) {
            originalTime = clampedStart + (audioBufferTime - timeProcessed);
            break;
        }

        timeProcessed += rangeDuration;
    }

    return originalTime;
};

const sortAndMergeRanges = (ranges: IAudioRange[]): IAudioRange[] => {
    ranges.sort((a, b) => a.start - b.start);

    const mergedRanges: IAudioRange[] = [];

    for (const range of ranges) {
        if (mergedRanges.length === 0 || range.start > mergedRanges[mergedRanges.length - 1].end) {
            mergedRanges.push({ ...range });
        } else {
            mergedRanges[mergedRanges.length - 1].end = Math.max(mergedRanges[mergedRanges.length - 1].end, range.end);
        }
    }

    return mergedRanges;
};
