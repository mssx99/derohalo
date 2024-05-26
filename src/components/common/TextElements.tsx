import React, { forwardRef } from 'react';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

interface ITitle extends TypographyProps {
    children: React.ReactNode;
}

export const HeaderTitle = forwardRef<HTMLElement, ITitle>(({ children, ...otherProps }, ref) => {
    return (
        <Typography ref={ref} variant="h6" {...otherProps}>
            {children}
        </Typography>
    );
});

export const SubTitle = forwardRef<HTMLElement, ITitle>(({ children, ...otherProps }, ref) => {
    return (
        <Typography ref={ref} variant="subtitle1" {...otherProps}>
            {children}
        </Typography>
    );
});

export const Body = forwardRef<HTMLElement, ITitle>(({ children, ...otherProps }, ref) => {
    return (
        <Typography ref={ref} variant="body1" {...otherProps}>
            {children}
        </Typography>
    );
});

export const Small = forwardRef<HTMLElement, ITitle>(({ children, ...otherProps }, ref) => {
    return (
        <Typography ref={ref} variant="body1" sx={{ fontSize: '0.725rem' }} {...otherProps}>
            {children}
        </Typography>
    );
});
