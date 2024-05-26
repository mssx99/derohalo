import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import { TransitionForDialog } from 'components/common/Transitions';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import ScidSelector from 'components/common/ScidSelector';
import DeroAvailableAmountField from 'components/common/DeroAvailableAmountField';
import Button from '@mui/material/Button';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogCloseButton } from 'components/Main/Dialogs';
import Form, { FormElement } from 'components/common/Form';
import ScRpcDisplay from './ScRpcDisplay';
import { scInvoke, waitForTransaction } from 'helpers/DeroHelper';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import { updateSmartContractBalances } from 'hooks/deroHooks';
import { loadContractAndSet as loadGuaranteeContractAndSet } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { setBusyBackdrop } from 'hooks/mainHooks';

export const DEPOSIT_DIALOG_NAME = 'DepositDialog';

export interface IDepositTransaction {
    scid: Hash;
    scidReadOnly?: boolean;
    label: string;
    message?: string;
    amount: Uint64;
    amountReadOnly?: boolean;
    sc_rpc?: IRpc_Arguments[];
    asset?: Hash;
    fixedAsset?: boolean;
    specialFunction?: string;
}

export const useDepositDialog = () => {
    const dialogState = useSelector((state: RootState) => state.mainState.dialogs[DEPOSIT_DIALOG_NAME]);

    const isOpen = dialogState != null && dialogState.isOpen;

    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: DEPOSIT_DIALOG_NAME, isOpen: newIsOpen }));
    };

    const depositTransaction = dialogState?.value as IDepositTransaction;
    const setDepositTransaction = (newDepositTransaction: IDepositTransaction, isOpen: boolean = true) => {
        newDepositTransaction.scidReadOnly = newDepositTransaction.scidReadOnly ? true : false;
        newDepositTransaction.amountReadOnly = newDepositTransaction.amountReadOnly ? true : false;
        store.dispatch(mainStateActions.setDialog({ name: DEPOSIT_DIALOG_NAME, dialogState: { isOpen, value: newDepositTransaction } }));
    };

    return { isOpen, depositTransaction, setOpen, setDepositTransaction };
};

const DepositDialog: React.FC = () => {
    const { isOpen, setOpen, depositTransaction, setDepositTransaction } = useDepositDialog();

    const [scid, setScid] = useState<string | null>(null);
    const [amount, setAmount] = useState<Uint64 | null>(null);

    useEffect(() => {
        if (!depositTransaction) return;
        console.log('depositTransaction', depositTransaction);
        setScid(depositTransaction.scid);
        setAmount(depositTransaction.amount);
    }, [depositTransaction]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleDeposit = useCallback(async () => {
        if (!scid) {
            addSnackbar({ message: `No scid selected.`, severity: MESSAGE_SEVERITY.ERROR });
            return;
        }
        try {
            setBusyBackdrop(true, 'Depositing...');
            const txid = await scInvoke({ scid, sc_dero_deposit: amount ?? undefined, sc_rpc: depositTransaction.sc_rpc ?? [], waitFor: true });
            if (depositTransaction.specialFunction === 'Guarantee') {
                await loadGuaranteeContractAndSet(depositTransaction.scid, false);
            } else {
                updateSmartContractBalances(scid);
            }
            addSnackbar({ message: `Deposited successfully.`, severity: MESSAGE_SEVERITY.SUCCESS });
            handleClose();
        } catch (e) {
            addSnackbar({ message: `An error occurred. ${e}`, severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [scid, depositTransaction, amount]);

    const handleScidChange = (newScid: ISmartContractDirectoryEntry | string | null, verified: boolean) => {
        if (typeof newScid === 'object') {
            setScid(newScid?.scid ?? null);
        } else {
            setScid(newScid);
        }
    };

    const handleOnChangeAmount = (amount: Uint64) => {
        setAmount(amount);
    };

    const depositDisabled = useMemo(() => {
        return amount && amount > 0 && scid !== null ? false : true;
    }, [amount, scid]);

    if (!depositTransaction) return <></>;

    return (
        <Dialog
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '48rem',
                        maxWidth: '100%',
                    },
                },
            }}
            open={isOpen}
            onClose={handleClose}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            aria-labelledby="deposit-dialog-title"
        >
            <DialogTitle id="deposit-dialog-title">Deposit</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                {depositTransaction.message && <p>{depositTransaction.message}</p>}
                <Form>
                    <FormElement>
                        <ScidSelector value={depositTransaction.scid} onChange={handleScidChange} sx={{ maxWidth: null }} readOnly={depositTransaction.scidReadOnly} />
                    </FormElement>
                    <FormElement label="Amount">
                        <DeroAvailableAmountField label={depositTransaction.label} value={amount ?? 0} onValueChange={handleOnChangeAmount} readOnly={depositTransaction.amountReadOnly} />
                    </FormElement>

                    <FormElement>
                        <ScRpcDisplay value={depositTransaction.sc_rpc} />
                    </FormElement>
                </Form>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleDeposit} disabled={depositDisabled}>
                    Deposit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DepositDialog;
