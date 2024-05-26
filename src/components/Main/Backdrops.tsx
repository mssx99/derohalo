import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import { SubTitle } from 'components/common/TextElements';
import Box from '@mui/material/Box';
import { useBusyBackdrop } from 'hooks/mainHooks';

const Backdrops: React.FC = () => {
    return <BusyBackdrop />;
};

const BusyBackdrop: React.FC = () => {
    const busyBackdrop = useBusyBackdrop();

    return (
        <Backdrop sx={{ color: '#fff', zIndex: 1301 }} open={busyBackdrop.open}>
            <Box display="flex" flexDirection="column" alignItems="center">
                <CircularProgress color="inherit" />
                <SubTitle sx={{ mt: 2 }}>{busyBackdrop.message}</SubTitle>
            </Box>
        </Backdrop>
    );
};

export default Backdrops;
