import React, { useId } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { TransitionForDialog } from 'components/common/Transitions';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { DialogCloseButton } from '../Dialogs';
import EditorTabs from './EditorTabs';

import { styled } from '@mui/material/styles';

const DIRECTORY_DIALOG_NAME = 'DirectoryDialog';

interface IDirectoryDialog {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
}

export const useDirectoryDialog: () => IDirectoryDialog = () => {
    const directoryDialogState = useSelector((state: RootState) => state.mainState.dialogs[DIRECTORY_DIALOG_NAME]);

    const isOpen = directoryDialogState != null && directoryDialogState.isOpen;
    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: DIRECTORY_DIALOG_NAME, isOpen: newIsOpen }));
    };

    return { isOpen, setOpen };
};

const StyledDialogContent = styled(DialogContent)({
    padding: '5px',
});

const DirectoryDialog = () => {
    const { isOpen, setOpen } = useDirectoryDialog();

    const id_scrollDialogTitle = useId();

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            aria-labelledby={id_scrollDialogTitle}
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '100%',
                        maxWidth: '1400px',
                    },
                },
            }}
        >
            <DialogTitle id={id_scrollDialogTitle}>Directory</DialogTitle>
            <StyledDialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <EditorTabs />
            </StyledDialogContent>
        </Dialog>
    );
};

export default DirectoryDialog;
