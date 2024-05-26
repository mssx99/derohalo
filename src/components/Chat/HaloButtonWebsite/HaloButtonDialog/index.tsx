import React, { useEffect, useRef, useCallback, useState, useId } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { TransitionForDialog } from 'components/common/Transitions';
import { TransitionProps } from '@mui/material/transitions';
import { DialogCloseButton } from 'components/Main/Dialogs';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';

import Form, { FormElement } from 'components/common/Form';
import { useCheckProtocolHandler } from 'helpers/ProtocolHelper';
import ActionSelector from './ActionSelector';
import FallbackUrl from './FallbackUrl';
import TooltipText from './TooltipText';
import PreviewPanel from './PreviewPanel';
import ChatButtonPanel from './ChatButtonPanel';
import { createDefaultHaloButtonConfig } from './HaloButtonHelper';
import ContractButtonPanel from './ContractButtonPanel';

export const HALOBUTTON_DIALOG_NAME = 'haloButtonDialog';

export const useHaloButtonDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
    haloButtonConfig: IHaloButtonConfig;
    setHaloButtonConfig: (haloButtonConfig: IHaloButtonConfig, isOpen?: boolean) => void;
} = () => {
    const dialogState = useSelector((state: RootState) => state.mainState.dialogs[HALOBUTTON_DIALOG_NAME]);

    const isOpen = dialogState != null && dialogState.isOpen;
    const setOpen = (isOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: HALOBUTTON_DIALOG_NAME, isOpen }));
    };

    const haloButtonConfig = dialogState?.value ? (dialogState?.value as IHaloButtonConfig) : createDefaultHaloButtonConfig();
    const setHaloButtonConfig = (haloButtonConfig: IHaloButtonConfig, isOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialog({ name: HALOBUTTON_DIALOG_NAME, dialogState: { isOpen, value: haloButtonConfig } }));
    };

    return { isOpen, setOpen, haloButtonConfig, setHaloButtonConfig };
};

const HaloButtonDialog: React.FC = () => {
    const { isOpen, setOpen, haloButtonConfig } = useHaloButtonDialog();

    const id_scrollDialogTitle = useId();

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '45rem',
                        maxWidth: '100%',
                    },
                },
            }}
            open={isOpen}
            onClose={handleClose}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            aria-labelledby={id_scrollDialogTitle}
        >
            <DialogTitle id={id_scrollDialogTitle}>Configure a Button for your Website</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Form>
                    <FormElement label="Fallback-URL">
                        <FallbackUrl />
                    </FormElement>

                    <FormElement label="Tooltip-Text">
                        <TooltipText />
                    </FormElement>

                    <PreviewPanel />

                    <FormElement label="Button action">
                        <ActionSelector />
                    </FormElement>

                    {haloButtonConfig.action === 'OPEN_CHAT' ? <ChatButtonPanel /> : <ContractButtonPanel />}
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default HaloButtonDialog;
