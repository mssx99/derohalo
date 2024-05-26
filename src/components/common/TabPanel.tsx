import React, { useEffect, useRef, useCallback, useState } from 'react';
import Slide from '@mui/material/Slide';
import { styled } from '@mui/material/styles';

interface ITabPanel {
    children: React.ReactNode;
    value: number;
    oldValue: number;
    index: number;
    container: HTMLElement;
    noAnimation: boolean;
}

const Container = styled('div')({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'scroll',
    overflowX: 'hidden',
    padding: 8,
});

const TabPanel: React.FC<ITabPanel> = ({ children, value, oldValue, index, container, noAnimation, ...other }) => {
    const wasSelected = oldValue === index;
    const selected = value === index;

    let direction: 'left' | 'right' | 'up' | 'down' | undefined;

    if (wasSelected != selected && (wasSelected || selected)) {
        if (selected) {
            //entering
            direction = oldValue < value ? 'left' : 'right';
        } else {
            //exiting
            direction = value < oldValue ? 'left' : 'right';
        }
    }

    let timeout = noAnimation ? 0 : 200;

    return (
        <Slide direction={direction} in={selected} container={container} timeout={timeout} easing={{ enter: 'ease-in-out', exit: 'ease-in-out' }}>
            <Container role="tabpanel" id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
                {children}
            </Container>
        </Slide>
    );
};

export default TabPanel;
