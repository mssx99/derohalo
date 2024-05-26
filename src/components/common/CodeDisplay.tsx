import React, { useEffect, useState, CSSProperties } from 'react';
import { styled, keyframes, css } from '@mui/material/styles';

import { Button } from '@mui/material';
import { flipInY as fadeIn, flipOutX as fadeOut, merge } from 'react-animations';
import useAnimation from 'hooks/customHooks';
import { CODE_DISPLAY_ANIMATION_DURATION, CONTRACT_BYTE_LIMIT } from 'Constants';
import SwitchWithLabel from './SwitchWithLabel';
import { formatKilobytes } from 'helpers/FormatHelper';

interface ICodeDisplay extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    description?: string;
    code?: string;
    children?: React.ReactNode;
    show?: boolean;
    fadeInAnimation?: string;
    fadeOutAnimation?: string;
    displayKb?: boolean;
}

const defaultFadeInAnimation = keyframes`${fadeIn}`;
const defaultFadeOutAnimation = keyframes`${fadeOut}`;

const Container = styled('div')<{ animation: CSSProperties['animation']; fadeDuration?: number; expand?: boolean }>`
    ${({ animation, fadeDuration = CODE_DISPLAY_ANIMATION_DURATION, expand = false }) => css`
        position: relative;
        display: flex;
        flex-direction: column;
        color: white;
        width: 100%;
        background-color: #131313;
        border-radius: 7px;
        padding: 10px;
        animation: ${fadeDuration / 1000}s ${animation};
        flex-basis: ${expand ? '100%' : ''};
        max-height: 45rem;
    `}
`;

const Subtitle = styled('div')(
    () => css`
        margin: '0px';
        font-family: 'Roboto', 'Helvetica', 'Arial', 'sans-serif';
        font-weight: normal;
        font-size: '1rem';
        line-height: 1.334;
        letter-spacing: '0em';
    `
);

const Title = styled('div')({
    margin: '0px',
    fontFamily: "'Roboto', 'Helvetica', 'Arial', 'sans-serif'",
    fontWeight: 400,
    fontSize: '1.5rem',
    lineHeight: 1.334,
    letterSpacing: '0em',
});

const Description = styled('div')(
    () => css`
        margin: '0px';
        font-family: 'Roboto', 'Helvetica', 'Arial', 'sans-serif';
        font-weight: normal;
        font-size: '1rem';
        line-height: 1.334;
        letter-spacing: '0em';
    `
);

const DisplayKb = styled('div')<{ bytes: number }>(
    ({ bytes }) => css`
        position: absolute;
        right: 10px;
        font-family: 'Roboto', 'Helvetica', 'Arial', 'sans-serif';
        font-weight: normal;
        font-size: 1.5rem;
        line-height: 1.334;
        letter-spacing: 0em;
        color: ${bytes > CONTRACT_BYTE_LIMIT ? 'red' : '#cbcbcb'};
        span {
            font-size: 1rem;
        }
    `
);

export const Code = styled('div')(
    () => css`
        flex-grow: 1;
        background-color: black;
        color: #bab8b8;
        position: relative;
        font-family: monospace, monospace;
        white-space: pre;
        overflow: auto;
        transition: all 2s ease-in-out;
    `
);

const CodeDisplay: React.FC<ICodeDisplay> = ({
    title,
    subtitle,
    description,
    code,
    className,
    children,
    show = true,
    fadeInAnimation = defaultFadeInAnimation,
    fadeOutAnimation = defaultFadeOutAnimation,
    displayKb = true,
    ...otherProps
}) => {
    const [expand, setExpand] = useState(false);
    const { isShow, isHide, setShow } = useAnimation(CODE_DISPLAY_ANIMATION_DURATION - 100);

    useEffect(() => {
        setShow(show);
    }, [show]);

    if (isHide) return null;
    return (
        <Container className={`${className}`} animation={show ? fadeInAnimation : fadeOutAnimation} expand={expand} {...otherProps}>
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
            <Description>{description}</Description>
            {displayKb && code && (
                <DisplayKb bytes={code.length}>
                    {formatKilobytes(code.length)}
                    <span>kb</span>
                </DisplayKb>
            )}

            <SwitchWithLabel label="Expand " checked={expand} onChange={setExpand} />
            {children}
            <Code>{code}</Code>
        </Container>
    );
};

export default CodeDisplay;
