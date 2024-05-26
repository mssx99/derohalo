import React, { useCallback } from 'react';
import { styled, css } from '@mui/material/styles';

import Grid from '@mui/material/Grid';
import Transaction, { isIEditableTransaction } from './Transaction';

interface ITransactionList {
    values: (IEditableTransaction | ITransaction)[];
    disabled?: boolean;
    readOnly?: boolean;
    onChange?: (newList: IEditableTransaction[]) => void;
}

const TransactionList: React.FC<ITransactionList> = ({ values, disabled = false, readOnly = false, onChange }) => {
    const handleTransactionChange = useCallback(
        (transaction: IEditableTransaction, valid: boolean, index: number) => {
            const newEditableTransactionList = [...values];

            newEditableTransactionList[index] = transaction;
            onChange && onChange(newEditableTransactionList as IEditableTransaction[]);
        },
        [values]
    );

    return (
        <Grid container rowSpacing={1} columnSpacing={1}>
            {values.map((value, index) => (
                <Transaction
                    key={isIEditableTransaction(value) ? value.id : index}
                    value={value}
                    disabled={disabled}
                    readOnly={readOnly}
                    onChange={(transaction, valid) => handleTransactionChange(transaction, valid, index)}
                />
            ))}
        </Grid>
    );
};

export default TransactionList;
