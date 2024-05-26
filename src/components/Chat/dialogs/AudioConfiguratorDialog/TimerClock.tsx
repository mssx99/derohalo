import React, { useEffect, useState } from 'react';
import { useAudioConfiguratorStore, useHoverTimeStore } from '.';
import { styled } from '@mui/material/styles';
import { formatTimer } from 'helpers/FormatHelper';
import { AUDIO_AMBER_UNTIL, AUDIO_GREEN_UNTIL } from 'Constants';
import { getTotalSelectedTime } from 'helpers/AudioHelper';

interface ITimerClock {
    isMicrophoneRecording?: boolean;
}

interface ContainerProps {
    color?: string;
}

const Container = styled('div', {
    shouldForwardProp: (propName: string) => propName !== 'color',
})<ContainerProps>`
    font-family: 'AlarmClock', sans-serif;
    font-size: 24px;
    color: ${(props) => props.color || '#6f32d1'};
    transition: color 0.3s ease;
    text-align: right;
`;

const TimerClock: React.FC<ITimerClock> = ({ isMicrophoneRecording = false }) => {
    const { elapsedTime } = useAudioConfiguratorStore();

    let color = isMicrophoneRecording ? (elapsedTime <= AUDIO_GREEN_UNTIL ? 'green' : elapsedTime <= AUDIO_AMBER_UNTIL ? 'orange' : 'red') : 'white';

    return <Container color={color}>{formatTimer(elapsedTime * 1000)}</Container>;
};

const TotalContainer = styled(Container)`
    font-size: 18px;
`;

export const TotalClock: React.FC = () => {
    const { ranges } = useAudioConfiguratorStore();
    const editedRange = useHoverTimeStore((state) => state.editedRange);
    const [totalRangeTime, setTotalRangeTime] = useState<number>(0);

    useEffect(() => {
        const r = editedRange ? [...ranges, editedRange] : ranges;
        const total = getTotalSelectedTime(r);
        setTotalRangeTime(total);
    }, [ranges, editedRange]);

    let color = totalRangeTime <= AUDIO_GREEN_UNTIL ? 'green' : totalRangeTime <= AUDIO_AMBER_UNTIL ? 'orange' : 'red';

    return <TotalContainer color={color}>{formatTimer(totalRangeTime * 1000)}</TotalContainer>;
};

export default TimerClock;
