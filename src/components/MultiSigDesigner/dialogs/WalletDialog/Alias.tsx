import React from 'react';
import TextField from 'components/common/TextField';

interface IAlias {
    value: string;
    label?: string;
    readOnly?: boolean;
    onChange: (alias: string) => void;
}

const Alias: React.FC<IAlias> = ({ value, label = 'Wallet Alias', readOnly = false, onChange }) => {
    return (
        <TextField
            id="wallet_alias"
            sx={{ maxWidth: 200 }}
            label={label}
            fullWidth
            value={value}
            readOnly={readOnly}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                onChange(event.target.value);
            }}
        />
    );
};

export default Alias;
