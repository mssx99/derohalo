import React from 'react';
import { useAudioConfiguratorStore } from '.';
import { styled } from '@mui/material/styles';
import { formatTimer } from 'helpers/FormatHelper';

interface IHoverClock {
    hoverTime: number;
    color?: string;
}

interface ContainerProps {
    color?: string;
}

const Container = styled('div', {
    shouldForwardProp: (propName: string) => propName !== 'color',
})<ContainerProps>`
    position: absolute;
    top: -20px;
    font-family: 'AlarmClock', sans-serif;
    font-size: 18px;
    color: ${(props) => props.color || '#e0ccff'};
    transition: color 0.3s ease; // This will add the transition effect
    transform: translateX(-50%);
`;

const HoverClock: React.FC<IHoverClock> = ({ hoverTime, color }) => {
    return <Container color={color}>{formatTimer(hoverTime * 1000)}</Container>;
};

export default HoverClock;
