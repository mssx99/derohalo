import React, { useMemo } from 'react';
import Button from '@mui/material/Button';
import { styled, css } from '@mui/material/styles';

import Accordion, { AccordionProps } from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useContract } from 'hooks/multiSigHooks';
import DeroAmount from 'components/common/DeroAmount';
import { TransactionActionButtons, TransactionContent } from 'components/MultiSigDesigner/Transactions/dialogs/TransactionDialog/ViewTransactionDialog';
import { useWalletAddress } from 'hooks/deroHooks';

const Accordions = () => {
    const { contract } = useContract();

    if (!contract.proposedTransactions?.length) {
        return <div>No transactions.</div>;
    }

    return (
        <div>
            {contract.proposedTransactions.map((t) => (
                <TransDisplay key={t.txid} value={t} />
            ))}
        </div>
    );
};

interface ITransDisplay extends Omit<AccordionProps, 'children'> {
    value: IAtomicTransaction;
}

const TitleContainer = styled('div')(css`
    display: flex;
    flex-direction: row;
    width: 100%;

    justify-content: space-between;
    & > div:nth-of-type(2) {
        width: 200px;
    }
`);

const InfoContainer = styled('div')(css`
    display: flex;
    flex-direction: row;
    & > div {
        display: inline-block;
    }
    & > div:first-of-type {
        width: 100px;
        flex-shrink: 0;
    }

    & > div:not(:first-of-type) {
        flex-grow: 1;
    }
`);

const ApprovalStatus = styled('div')(css`
    font-size: 0.75em;
    vertical-align: super;
    margin-left: 3px;
`);

const TransDisplay: React.FC<ITransDisplay> = ({ value }) => {
    const walletAddress = useWalletAddress();
    const totalTransaction = useMemo(() => {
        return value.transactions.reduce((acc, t) => acc + t.amount, 0);
    }, [value.transactions]);

    const approvalStatus = walletAddress && value.approvalStatus[walletAddress] ? value.approvalStatus[walletAddress] : null;

    let transactionState = useMemo(() => {
        switch (value.state) {
            case 'PENDING':
                let approvalText = '';
                if (approvalStatus == 'APPROVED') {
                    approvalText = 'You approved!';
                } else if (approvalStatus == 'REJECTED') {
                    approvalText = 'You rejected!';
                } else {
                    approvalText = 'Decide!';
                }
                return (
                    <>
                        <span style={{ backgroundColor: 'red', color: 'white', paddingLeft: '5px', paddingRight: '5px', borderRadius: '5px' }}>Pending</span>
                        <ApprovalStatus>{approvalText}</ApprovalStatus>
                    </>
                );
            case 'DONE':
                return <div>Done</div>;
            case 'CANCELLED':
                return <div>Cancelled</div>;
        }
    }, [value.state, approvalStatus]);

    const handleChange = () => {};

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel3-content" id="panel3-header">
                <TitleContainer>
                    <InfoContainer>
                        <div>Id {value.atomicId}</div>
                        {transactionState}
                    </InfoContainer>{' '}
                    <DeroAmount sx={{ flexGrow: 1 }} value={totalTransaction} />
                </TitleContainer>
            </AccordionSummary>
            <AccordionDetails>
                <TransactionContent atomicTransaction={value} />
            </AccordionDetails>
            <AccordionActions>{value.state === 'PENDING' ? <TransactionActionButtons atomicTransaction={value} onChange={handleChange} /> : <></>}</AccordionActions>
        </Accordion>
    );
};

export default Accordions;
