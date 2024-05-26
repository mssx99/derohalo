import React from 'react';
import { styled } from '@mui/material/styles';
import Box, { BoxProps } from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { SxProps } from '@mui/system';

interface IForm extends BoxProps {
    label?: string;
    sx?: SxProps;
    children: React.ReactNode;
}

const Container = styled('div')({});

const Form: React.FC<IForm> = ({ label, children, sx, ...otherProps }) => {
    return (
        <Box sx={{ flexGrow: 1, ...sx }} {...otherProps}>
            <Grid container spacing={2}>
                {children}
            </Grid>
        </Box>
    );
};

export default Form;

interface IFormElement {
    label?: string;
    sx?: SxProps;
    labelWidth?: number;
    children?: React.ReactNode;
}

export const FormElement: React.FC<IFormElement> = ({ label, labelWidth, children, sx }) => {
    if (label) {
        if (!labelWidth) {
            labelWidth = 4;
        }
        return (
            <>
                <Grid item xs={labelWidth} sx={{ alignSelf: 'center', ...sx }}>
                    <FormLabel label={label} />
                </Grid>
                <Grid item xs={12 - labelWidth}>
                    {children}
                </Grid>
            </>
        );
    }

    return (
        <Grid item xs={12} sx={sx}>
            {children}
        </Grid>
    );
};

interface IFormLabel {
    label: string;
}

const FormLabel: React.FC<IFormLabel> = ({ label }) => {
    return <div>{label}</div>;
};
