import React, { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import { updateWalletBalance, useIsConnected, useWalletAddress, useWalletBalance } from 'hooks/deroHooks';
import DeroAmount from 'components/common/DeroAmount';
import { shortenScid } from 'helpers/DeroHelper';
import { Body, Small } from 'components/common/TextElements';
import Tooltip from '@mui/material/Tooltip';
import { useCopyToClipboard } from 'hooks/customHooks';

const Container = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'end',
    color: 'white', // Text color is white
    marginRight: '10px',
}));

const StyledDeroAmount = styled(DeroAmount)(({ theme }) => ({
    cursor: 'pointer',
    transition: 'color 0.5s ease-in-out',
    '&:hover': {
        color: theme.palette.primary.main,
    },
}));

const StyledSmall = styled(Small)(({ theme }) => ({
    cursor: 'pointer',
    transition: 'color 0.5s ease-in-out',
    '&:hover': {
        color: theme.palette.primary.main,
    },
}));

const WalletStatusPanel: React.FC = () => {
    const isConnected = useIsConnected();
    const walletAddress = useWalletAddress();
    const balance = useWalletBalance();
    const copy = useCopyToClipboard();

    const handleBalanceClick = useCallback(() => {
        updateWalletBalance();
    }, [walletAddress]);

    const handleCopy = useCallback(() => {
        if (walletAddress) {
            copy(walletAddress);
        }
    }, [walletAddress]);

    if (!isConnected || isNaN(balance)) return <></>;

    return (
        <Container>
            <Tooltip title="Click to refresh balance" followCursor>
                <StyledDeroAmount value={balance} onlyText={false} onClick={handleBalanceClick} />
            </Tooltip>
            <Tooltip title="Copy to Clipboard" followCursor>
                <StyledSmall onClick={handleCopy}>{shortenScid(walletAddress, 20)}</StyledSmall>
            </Tooltip>
        </Container>
    );
};

export default WalletStatusPanel;
