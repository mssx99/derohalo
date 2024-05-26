import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

import Dialog from '@mui/material/Dialog';
import { TransitionForDialog } from 'components/common/Transitions';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import ProposeTransactionDialog from './ProposeTransactionDialog';
import ViewTransactionDialog from './ViewTransactionDialog';

export const TRANSACTION_DIALOG_NAME = 'TransactionDialog';

export const useTransactionDialog = () => {
    const dialogState = useSelector((state: RootState) => state.mainState.dialogs[TRANSACTION_DIALOG_NAME]);

    const isOpen = dialogState != null && dialogState.isOpen;

    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: TRANSACTION_DIALOG_NAME, isOpen: newIsOpen }));
    };

    const atomicTransaction = dialogState?.value as IAtomicTransaction;
    const setAtomicTransaction = (newAtomicTransaction: IAtomicTransaction, isOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialog({ name: TRANSACTION_DIALOG_NAME, dialogState: { isOpen, value: newAtomicTransaction } }));
    };

    return { isOpen, atomicTransaction, setOpen, setAtomicTransaction };
};

export const TransactionDialog: React.FC = () => {
    const { isOpen, setOpen, atomicTransaction, setAtomicTransaction } = useTransactionDialog();

    const handleClose = () => {
        setOpen(false);
    };

    const content = useMemo(() => (atomicTransaction?.txid ? <ViewTransactionDialog /> : <ProposeTransactionDialog />), [atomicTransaction?.txid]);

    if (!atomicTransaction) return <></>;

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
            aria-labelledby="transaction-dialog-title"
        >
            {content}
        </Dialog>
    );
};

export default TransactionDialog;
