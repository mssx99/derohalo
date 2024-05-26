import React from 'react';
import { styled } from '@mui/material/styles';
import DeroStatus from 'components/dero/DeroStatus';
import IconButton from '@mui/material/IconButton';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import { usePreferencesDialog } from './PreferencesDialog';
import { useDirectoryDialog } from './DirectoryDialog';
import WalletStatusPanel from './WalletStatusPanel';

const Container = styled('div')({
    display: 'flex',
});

const SettingsPanel: React.FC = () => {
    const { setOpen: setPreferencesOpen } = usePreferencesDialog();
    const { setOpen: setDirectoryOpen } = useDirectoryDialog();

    const showWalletDirectory = () => {
        setDirectoryOpen(true);
    };

    const showSettingsDialog = () => {
        setPreferencesOpen(true);
    };

    return (
        <Container>
            <WalletStatusPanel />
            <DeroStatus />
            <IconButton aria-label="Wallet Directory" color="primary" onClick={showWalletDirectory}>
                <PeopleIcon />
            </IconButton>
            <IconButton aria-label="Settings" color="primary" onClick={showSettingsDialog}>
                <SettingsIcon />
            </IconButton>
        </Container>
    );
};

export default SettingsPanel;
