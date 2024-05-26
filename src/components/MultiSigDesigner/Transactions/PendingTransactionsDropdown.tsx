import React, { useEffect, useState, useCallback } from 'react';
import Autocomplete, { AutocompleteChangeReason, AutocompleteChangeDetails } from '@mui/material/Autocomplete';
import TextField from 'components/common/TextField';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { useProposedTransactions } from 'hooks/multiSigHooks';
import DeroAmount from 'components/common/DeroAmount';
import Grid from '@mui/material/Grid';

interface IPendingTransactionsDropdown {
    value: IAtomicTransaction | null;
    onChange: (scid: IAtomicTransaction | null) => void;
}

const CustomPaper = styled(Paper)({
    width: 1000,
});

const PendingTransactionsDropdown: React.FC<IPendingTransactionsDropdown> = ({ value: receivedValue, onChange }) => {
    const [value, setValue] = useState<IAtomicTransaction | null>(null);
    const transactions = useProposedTransactions().filter((t) => t.state === 'PENDING');

    useEffect(() => {
        setValue(receivedValue);
    }, [receivedValue]);

    const sendChange = useCallback(
        (value: IAtomicTransaction | null) => {
            setValue(value);
            onChange(value);
        },
        [onChange]
    );

    const handleAutocompleteChange = useCallback(
        (
            event: React.SyntheticEvent<Element, Event>,
            value: IAtomicTransaction | string | null,
            reason: AutocompleteChangeReason,
            details?: AutocompleteChangeDetails<IAtomicTransaction> | undefined
        ) => {
            if (reason === 'clear') {
                sendChange(null);
            } else {
                if (typeof value === 'string') {
                    value = transactions.find((t) => t.txid === value) ?? null;
                }
                sendChange(value);
            }
        },
        [sendChange, transactions]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter') {
                sendChange(value);
            }
        },
        [value]
    );

    return (
        <Autocomplete
            id="transactionSelector"
            fullWidth
            options={transactions}
            getOptionLabel={(option) => {
                if (typeof option === 'object') return option.txid ?? '';
                return option;
            }}
            isOptionEqualToValue={(option, value) => option?.txid === value?.txid}
            renderOption={(props, option) => (
                <li {...props}>
                    <Grid key={option.txid} container alignItems="center" spacing={1}>
                        <Grid xs={1} item>
                            {option.atomicId}
                        </Grid>
                        <Grid xs={7.4} item>
                            {option.txid}
                        </Grid>
                        <Grid xs={1.2} item style={{ display: 'flex', justifyContent: 'center' }}>
                            {option.transactions.length} Trans.
                        </Grid>
                        <Grid xs={2.4} item style={{ textAlign: 'right' }}>
                            <DeroAmount value={option.transactions.reduce((acc, t) => acc + t.amount, 0)} onlyText />
                        </Grid>
                    </Grid>
                </li>
            )}
            freeSolo
            autoHighlight
            PaperComponent={CustomPaper}
            onChange={handleAutocompleteChange}
            renderInput={(params) => <TextField {...params} label="Pending transactions for this SmartContract" onKeyDown={handleKeyDown} />}
        />
    );
};

export default PendingTransactionsDropdown;
