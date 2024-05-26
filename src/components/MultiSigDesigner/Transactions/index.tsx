import React, { useEffect, useRef, useCallback, useState } from 'react';
import { styled, css } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { WALLET_BACKGROUND_COLOR } from 'Constants';
import PendingTransactionsDropdown from './PendingTransactionsDropdown';
import { useWalletAddress } from 'hooks/deroHooks';
import { useTransactionDialog } from './dialogs/TransactionDialog';
import { useDepositDialog } from 'components/common/dialogs/DepositDialog';
import { useContract } from 'hooks/multiSigHooks';
import { useHistoryDialog } from '../dialogs/HistoryDialog';

const Container = styled('div')(
    css`
        display: flex;
        flex-grow: 1;
        gap: 10px;
        margin-bottom: 10px;
    `
);

const Transactions: React.FC = () => {
    const { setDepositTransaction } = useDepositDialog();
    const { setOpen: setHistoryOpen } = useHistoryDialog();
    const { setAtomicTransaction: setProposeTransaction } = useTransactionDialog();
    const walletAddress = useWalletAddress();
    const { contract, isNew, isLoaded } = useContract();
    const [isInvolvedParty, setIsInvolvedParty] = useState(false);
    const [selectedTransactionValue, setSelectedTransactionValue] = useState<IAtomicTransaction | null>(null);

    useEffect(() => {
        if (contract) {
            setIsInvolvedParty(contract.involvedParties.some((e) => e.address === walletAddress));
        } else {
            setIsInvolvedParty(false);
        }
    }, [contract]);

    const handleClickDeposit = useCallback(() => {
        if (!contract.scid) return;
        setDepositTransaction({
            scid: contract.scid,
            label: 'Amount to be deposited in MultiSigSmartContract',
            message: undefined,

            sc_rpc: [{ name: 'entrypoint', datatype: 'S', value: 'Deposit' }],
            amount: 0,
        });
    }, [contract]);

    const handleClickHistory = () => {
        setHistoryOpen(true);
    };

    const handleClickPropose = () => {
        setProposeTransaction({
            transactions: [],
            approvalStatus: {},
            createdBy: walletAddress,
            state: 'NEW',
        });
    };

    const handleReviewTransaction = useCallback(() => {
        setProposeTransaction(selectedTransactionValue!);
    }, [selectedTransactionValue]);

    const handleSelectedTransactionChange = (value: IAtomicTransaction | null) => {
        setSelectedTransactionValue(value);
    };

    return (
        <Container>
            <Button onClick={handleClickDeposit} variant="contained" size="small">
                Deposit
            </Button>
            <Button onClick={handleClickPropose} variant="contained" size="small" disabled={!isInvolvedParty}>
                Propose Transaction
            </Button>
            <Button size="small" onClick={handleClickHistory} disabled={contract.proposedTransactions.length === 0}>
                History
            </Button>
            <PendingTransactionsDropdown value={selectedTransactionValue} onChange={handleSelectedTransactionChange} />
            <Button variant="contained" color="secondary" size="small" onClick={handleReviewTransaction} disabled={!isInvolvedParty || !selectedTransactionValue}>
                Review Transaction
            </Button>
        </Container>
    );
};

export default Transactions;
