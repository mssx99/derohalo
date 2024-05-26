import React, { useMemo, useState } from 'react';
import { styled } from '@mui/material/styles';
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Zoom from '@mui/material/Zoom';

interface IProgressIndicator {
    value: IChatMessage;
}

const Container = styled('div')`
    position: absolute;
    top: 0;
    left: -45px;
    pointer-events: none;
`;

const ProgressIndicator: React.FC<IProgressIndicator> = ({ value: chatMessage }) => {
    const [shown, setShown] = useState(false);

    const value = useMemo(() => {
        if (!chatMessage || !chatMessage.transactions || chatMessage.transactions.length === 0) return 0;
        const totalTransactions = chatMessage.transactions.length;
        const completedTransactions = chatMessage.transactions.filter((t) => t.state === 'COMPLETED').length;
        const newValue = Math.round((completedTransactions * 100) / totalTransactions);
        if (newValue === 100) {
            setTimeout(() => setShown(false), 2000);
        } else if (newValue < 100) {
            setShown(true);
        } else {
            setShown(false);
        }
        return newValue;
    }, [chatMessage]);

    return (
        <Container>
            <Zoom in={shown}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress variant="determinate" value={value} />
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="caption" component="div" color="text.secondary">{`${value}%`}</Typography>
                    </Box>
                </Box>
            </Zoom>
        </Container>
    );
};

export default ProgressIndicator;
