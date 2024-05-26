import React from 'react';
import { APPROVED, REJECTED } from 'components/MultiSigDesigner/Transactions/dialogs/TransactionDialog/ViewTransactionDialog/ApprovalStatus';

interface IVerified {
    value: boolean;
}

const Verified: React.FC<IVerified> = ({ value }) => {
    return <div>{value ? APPROVED : REJECTED}</div>;
};

export default Verified;
