import React from 'react';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';

export const TransitionForDialog = React.forwardRef(
    (
        props: TransitionProps & {
            children: React.ReactElement<any, any>;
        },
        ref: React.Ref<unknown>
    ) => {
        return <Slide direction="up" ref={ref} {...props} />;
    }
);
