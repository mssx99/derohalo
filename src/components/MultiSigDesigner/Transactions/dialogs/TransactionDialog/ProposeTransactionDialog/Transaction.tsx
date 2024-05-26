import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { styled, css } from '@mui/material/styles';

import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import WalletAddressSelector from 'components/common/WalletAddressSelector';
import DeroAmountField from 'components/common/DeroAmountField';
import DeroAmount from 'components/common/DeroAmount';
import { getWalletAddress } from 'helpers/DeroHelper';

interface ITransactionProps {
    value: IEditableTransaction | ITransaction;
    onChange?: (transaction: IEditableTransaction, valid: boolean) => void;
    disabled?: boolean;
    readOnly?: boolean;
}

export const isIEditableTransaction = (item: any): item is IEditableTransaction => {
    return item && typeof item.id === 'string' && (typeof item.address === 'string' || item.address === null) && typeof item.amount === 'number';
};

const Transaction: React.FC<ITransactionProps> = ({ value, onChange, disabled = false, readOnly = false }) => {
    const handleOnChangeAddress = useCallback(
        (address: IWalletDirectoryEntry | string | null, verified: boolean) => {
            console.log(address, verified);
            if (isIEditableTransaction(value)) {
                if (verified && address) {
                    onChange && onChange({ id: value.id, address: getWalletAddress(address), amount: value.amount }, value.amount > 0);
                } else if (!address) {
                    onChange && onChange({ id: value.id, address: getWalletAddress(address), amount: value.amount }, false);
                }
            }
        },
        [isIEditableTransaction(value) ? value.id : null, value.amount, onChange]
    );

    const handleOnChangeAmount = useCallback(
        (amount: Uint64) => {
            if (isIEditableTransaction(value)) {
                onChange && onChange({ id: value.id, address: value.address, amount }, value.amount > 0);
            }
        },
        [isIEditableTransaction(value) ? value.id : null, value.address, onChange]
    );

    return (
        <>
            <Grid item xs={9.7}>
                <WalletAddressSelector value={value.address} onChange={handleOnChangeAddress} disabled={disabled} readOnly={readOnly} />
            </Grid>
            <Grid item xs={2.3}>
                <DeroAmountField label="Amount" fullWidth value={value.amount} onValueChange={handleOnChangeAmount} disabled={disabled} readOnly={readOnly} />
            </Grid>
        </>
    );
};

export default Transaction;
