import React, { useId } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import Form, { FormElement } from 'components/common/Form';
import NumberTextField from 'components/common/NumberTextField';
import { TransitionForDialog } from 'components/common/Transitions';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import ConnectionTypeSelector from './ConnectionTypeSelector';
import DisplayUsdControls from './DisplayUsdControls';
import { DialogCloseButton } from '../Dialogs';
import VerificationDialog from './VerificationDialog';

const PREFERENCES_DIALOG_NAME = 'preferencesDialog';

interface IPreferencesDialog {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
}

export const usePreferencesDialog: () => IPreferencesDialog = () => {
    const preferencesDialogState = useSelector((state: RootState) => state.mainState.dialogs[PREFERENCES_DIALOG_NAME]);

    const isOpen = preferencesDialogState != null && preferencesDialogState.isOpen;
    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: PREFERENCES_DIALOG_NAME, isOpen: newIsOpen }));
    };

    return { isOpen, setOpen };
};

const PreferencesDialog: React.FC = () => {
    const { isOpen, setOpen } = usePreferencesDialog();

    const id_scrollDialogTitle = useId();

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} scroll="paper" TransitionComponent={TransitionForDialog} aria-labelledby={id_scrollDialogTitle}>
            <DialogTitle id={id_scrollDialogTitle}>Preferences</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Form>
                    <FormElement>
                        <ConnectionTypeSelector />
                    </FormElement>
                    <FormElement>
                        <DisplayUsdControls />
                    </FormElement>
                    <FormElement>
                        <VerificationDialog />
                    </FormElement>
                </Form>
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={handleClose}>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PreferencesDialog;
