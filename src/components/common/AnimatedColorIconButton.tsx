import React from 'react';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import { styled, keyframes } from '@mui/material/styles';

interface IAnimatedIconButton extends IconButtonProps {
    color1?: string;
    color2?: string;
    duration?: number;
    children?: React.ReactNode;
}

const AnimatedColorIconButton: React.FC<IAnimatedIconButton> = ({ color1 = '#686868', color2 = '#7e0d0d', duration = 3, children, ...otherProps }) => {
    const colorFade = keyframes`
    0% {
      background-color: ${color1};
    }
    50% {
      background-color: ${color2};
    }
    100% {
      background-color: ${color1};
    }
  `;
    const AnimatedIconButton = styled(IconButton)({
        animation: `${colorFade} ${duration}s infinite ease-in-out`, // Adjust '3s' to control the speed of the fade
    });

    return <AnimatedIconButton {...otherProps}>{children}</AnimatedIconButton>;
};

export default AnimatedColorIconButton;
