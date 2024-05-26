import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import Form, { FormElement } from 'components/common/Form';
import Button from '@mui/material/Button';
import { DialogCloseButton } from 'components/Main/Dialogs';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import TransactionList from './TransactionList';

import { nanoid } from 'nanoid';
import { useContract, useMultiSigSmartContractDeroBalance } from 'hooks/multiSigHooks';
import DeroAmount from 'components/common/DeroAmount';
import reactStringReplace from 'react-string-replace';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import { loadTransaction, proposeTransaction } from 'helpers/MultiSig/MultiSigSmartContractHelper';
import { useTransactionDialog } from '..';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { updateWalletBalance } from 'hooks/deroHooks';

export const PROPOSE_TRANSACTION_DIALOG_NAME = 'proposeTransactionDialog';

const createTransactionList = (tl: IEditableTransaction[]): ITransaction[] => {
    return tl.filter((t) => t.address && t.amount > 0).map((t) => ({ address: t.address as string, amount: t.amount }));
};

const createEditableTransactionList = (tl: ITransaction[]): IEditableTransaction[] => {
    return tl.map((t) => ({ id: nanoid(), ...t }));
};

const createEmptyTransaction = () => ({
    id: nanoid(),
    address: null,
    amount: 0,
});

const ProposeTransactionDialog: React.FC = () => {
    const { isOpen, setOpen, atomicTransaction, setAtomicTransaction } = useTransactionDialog();
    const [editableTransactionList, setEditableTransactionList] = useState<IEditableTransaction[]>([]);
    const [total, setTotal] = useState<Uint64>(0);
    const { contract } = useContract();
    const smartContractDeroBalance = useMultiSigSmartContractDeroBalance();

    const description = `The total of the operation is {total}. Transactions with missing address or zero amount will be ignored.
    The available balance in the SmartContract is {balance}.`;

    const descriptionMemo = useMemo(() => {
        return reactStringReplace(description, /{(.*?)}/g, (match, i) => {
            switch (match) {
                case 'total':
                    return <DeroAmount key={'obsObj_' + i} value={total} onlyText />;
                case 'balance':
                    return <DeroAmount key={'obsObj_' + i} value={smartContractDeroBalance} onlyText />;
            }
        });
    }, [total, smartContractDeroBalance]);

    useEffect(() => {
        if (!atomicTransaction) return;
        const newEditableTransactionList = createEditableTransactionList(atomicTransaction.transactions);
        newEditableTransactionList.push(createEmptyTransaction());
        setEditableTransactionList(newEditableTransactionList);
    }, [atomicTransaction]);

    useEffect(() => {
        const total = editableTransactionList.reduce((acc, t) => (t.address && t.amount > 0 ? acc + t.amount : acc), 0);
        setTotal(total);
    }, [editableTransactionList]);

    const handleTransactionListChange = (newEditableTransactionList: IEditableTransaction[]) => {
        const allValid = () => {
            if (newEditableTransactionList.every((et) => et.address && et.amount > 0)) {
                newEditableTransactionList.push(createEmptyTransaction());
                setEditableTransactionList(newEditableTransactionList);
                return true;
            }
            return false;
        };

        if (allValid()) {
            return;
        }

        newEditableTransactionList = newEditableTransactionList.reduce((acc, etl, index) => {
            if ((etl.address && etl.amount) || index == newEditableTransactionList.length - 1) acc.push(etl);
            return acc;
        }, new Array<IEditableTransaction>());

        if (allValid()) {
            return;
        }

        setEditableTransactionList(newEditableTransactionList);
    };

    const getValidTransactions = (tl: IEditableTransaction[]) => {
        return tl.filter((t) => t.address && t.amount) as ITransaction[];
    };

    const handleClear = () => {
        setEditableTransactionList([createEmptyTransaction()]);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handlePropose = useCallback(async () => {
        if (!contract?.scid) {
            addSnackbar({ message: `Contract needs to be selected and have an scid.`, severity: MESSAGE_SEVERITY.ERROR });
        }
        const transactionList = createTransactionList(editableTransactionList);

        for (let a = transactionList.length; a < contract.maxTransactionsInAtomic; a++) {
            transactionList.push({ address: '', amount: 0 });
        }

        try {
            setBusyBackdrop(true, 'Proposing the transaction...');
            const txid = await proposeTransaction(contract.scid!, transactionList);
            addSnackbar({ message: `Transaction Submitted successfully: ${txid}.`, severity: MESSAGE_SEVERITY.SUCCESS });

            const atomicTransaction = await loadTransaction(contract, txid);
            if (atomicTransaction) {
                setAtomicTransaction(atomicTransaction);
            } else {
                addSnackbar({ message: `Could not load transaction.`, severity: MESSAGE_SEVERITY.ERROR });
            }
        } catch (e) {
            console.error(e);
            addSnackbar({ message: `An error occurred.`, severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
            updateWalletBalance();
        }
    }, [editableTransactionList, contract]);

    return (
        <>
            <DialogTitle id="transaction-dialog-title">Propose a Transaction</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <p>{descriptionMemo}</p>
                <TransactionList values={editableTransactionList} onChange={handleTransactionListChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClear}>Clear</Button>
                <Button variant="contained" onClick={handlePropose} disabled={total === 0}>
                    Propose
                </Button>
            </DialogActions>
        </>
    );
};

export default ProposeTransactionDialog;
