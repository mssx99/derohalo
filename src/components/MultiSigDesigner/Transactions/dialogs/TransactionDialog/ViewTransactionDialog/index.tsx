import React, { useEffect, useMemo, useCallback } from 'react';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { DialogCloseButton } from 'components/Main/Dialogs';
import { useTransactionDialog } from '..';
import TransactionList from '../ProposeTransactionDialog/TransactionList';
import ApprovalStatus from './ApprovalStatus';
import { useContract, useMultiSigSmartContractDeroBalance } from 'hooks/multiSigHooks';
import { approveTransaction, loadTransaction } from 'helpers/MultiSig/MultiSigSmartContractHelper';
import { waitForTransaction } from 'helpers/DeroHelper';
import { useWalletAddress } from 'hooks/deroHooks';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import { setBusyBackdrop } from 'hooks/mainHooks';

const ViewTransactionDialog: React.FC = () => {
    const { isOpen, setOpen, atomicTransaction, setAtomicTransaction } = useTransactionDialog();
    const walletAddress = useWalletAddress();

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <DialogTitle id="transaction-dialog-title">Transaction Display</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <TransactionContent atomicTransaction={atomicTransaction} />
            </DialogContent>
            <DialogActions>
                {atomicTransaction?.state === 'PENDING' && walletAddress ? (
                    <TransactionActionButtons atomicTransaction={atomicTransaction} onChange={setAtomicTransaction} />
                ) : (
                    <Button variant="contained" onClick={handleClose}>
                        Ok
                    </Button>
                )}
            </DialogActions>
        </>
    );
};

interface ITransactionContent {
    atomicTransaction: IAtomicTransaction;
}

export const TransactionContent: React.FC<ITransactionContent> = ({ atomicTransaction }) => {
    const walletAddress = useWalletAddress();
    const smartContractDeroBalance = useMultiSigSmartContractDeroBalance();

    const totalTransaction = useMemo(() => (atomicTransaction?.transactions ? atomicTransaction.transactions.reduce((acc, t) => t.amount + acc, 0) : 0), [atomicTransaction]);

    const descriptionMemo = useMemo(() => {
        let message = '';
        switch (atomicTransaction?.state) {
            case 'PENDING':
                let amountWarning =
                    totalTransaction > smartContractDeroBalance
                        ? 'As there are not enough funds in the SmartContract take into account that if your approval would complete the transaction, the approval will not be accepted as the payments can not be send currently.'
                        : '';
                if (atomicTransaction.approvalStatus[walletAddress!] === 'APPROVED') {
                    message = `You have approved, but others need to approve still. ${amountWarning}`;
                } else {
                    message = `Check if you want to approve this transaction. ${amountWarning}`;
                }
                break;
            case 'DONE':
                message = 'The transaction was already done.';
                break;
            case 'CANCELLED':
                message = 'The transaction was cancelled.';
                break;
        }

        return `${atomicTransaction?.state}: ${message} `;
    }, [atomicTransaction, walletAddress, totalTransaction, smartContractDeroBalance]);

    return (
        <>
            <p>{descriptionMemo}</p>
            <TransactionList values={atomicTransaction.transactions} readOnly />
            <ApprovalStatus value={atomicTransaction.approvalStatus} />
        </>
    );
};

interface ITransactionActionButtons {
    atomicTransaction: IAtomicTransaction;
    onChange: (atomicTransaction: IAtomicTransaction) => void;
}

export const TransactionActionButtons: React.FC<ITransactionActionButtons> = ({ atomicTransaction, onChange }) => {
    const { contract } = useContract();

    const walletAddress = useWalletAddress();
    const smartContractDeroBalance = useMultiSigSmartContractDeroBalance();

    const totalTransaction = useMemo(() => (atomicTransaction?.transactions ? atomicTransaction.transactions.reduce((acc, t) => t.amount + acc, 0) : 0), [atomicTransaction]);
    const currentVote = useMemo(() => (walletAddress ? atomicTransaction.approvalStatus[walletAddress] : null), [atomicTransaction, walletAddress]);

    const handleReject = useCallback(async () => {
        try {
            setBusyBackdrop(true, 'Rejecting Transaction...');
            const updatedTransaction = await approveTransaction(contract, atomicTransaction, 'RejectVote');
            if (updatedTransaction) {
                onChange(updatedTransaction);
            }
        } catch (e) {
            addSnackbar({ message: `An error occurred.`, severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [atomicTransaction, contract]);

    const handleReset = useCallback(async () => {
        try {
            setBusyBackdrop(true, 'Resetting Transaction...');
            const updatedTransaction = await approveTransaction(contract, atomicTransaction, 'ResetVote');
            if (updatedTransaction) {
                onChange(updatedTransaction);
            }
        } catch (e) {
            addSnackbar({ message: `An error occurred.`, severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [atomicTransaction, contract]);

    const handleApprove = useCallback(async () => {
        try {
            setBusyBackdrop(true, 'Approving Transaction...');
            const updatedTransaction = await approveTransaction(contract, atomicTransaction);
            if (updatedTransaction) {
                onChange(updatedTransaction);
            }
            if (updatedTransaction.state === 'DONE') {
                addSnackbar({ message: `The transaction was executed.`, severity: MESSAGE_SEVERITY.SUCCESS });
            }
        } catch (e) {
            addSnackbar({ message: `An error occurred.`, severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [atomicTransaction, contract]);

    return (
        <>
            <Button variant="contained" onClick={handleReject} disabled={currentVote === 'REJECTED'}>
                Reject
            </Button>
            <Button onClick={handleReset} disabled={currentVote === ''}>
                Reset Vote
            </Button>
            <Button variant="contained" onClick={handleApprove} disabled={currentVote === 'APPROVED' || smartContractDeroBalance < totalTransaction}>
                Approve
            </Button>
        </>
    );
};

export default ViewTransactionDialog;
