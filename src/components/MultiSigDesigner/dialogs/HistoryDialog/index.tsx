import React, { useId } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { TransitionForDialog } from 'components/common/Transitions';
import { TransitionProps } from '@mui/material/transitions';
import { useContract } from 'hooks/multiSigHooks';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';

import { DialogCloseButton } from 'components/Main/Dialogs';
import Accordions from './Accordions';

export const HISTORY_MULTISIG_DIALOG_NAME = 'historyMultiSigDialog';

export const useHistoryDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
} = () => {
    const historyDialogState = useSelector((state: RootState) => state.mainState.dialogs[HISTORY_MULTISIG_DIALOG_NAME]);

    const isOpen = historyDialogState != null && historyDialogState.isOpen;
    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: HISTORY_MULTISIG_DIALOG_NAME, isOpen: newIsOpen }));
    };

    return { isOpen, setOpen };
};

const HistoryDialog: React.FC = () => {
    const { isOpen, setOpen } = useHistoryDialog();
    const id_dialogTitle = useId();

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '55rem',
                        maxWidth: '100%',
                    },
                },
            }}
            open={isOpen}
            onClose={handleClose}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            aria-labelledby={id_dialogTitle}
        >
            <DialogTitle id={id_dialogTitle}>History</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Accordions />
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={handleClose}>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default HistoryDialog;
