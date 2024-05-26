import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

type NumberTextFieldUpDownProps = {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    readOnly?: boolean;
} & Omit<TextFieldProps, 'onChange'>;

const NumberTextFieldUpDown = React.forwardRef<HTMLInputElement, NumberTextFieldUpDownProps>(({ value, onChange, min = 1, max = 40, step = 1, readOnly = false, ...other }, ref) => {
    const handleChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(value, 10);
        if (!isNaN(newValue)) {
            onChange(newValue);
        }
    };

    return (
        <TextField
            variant="filled"
            {...other}
            value={value}
            onChange={handleChange}
            type="number"
            inputProps={{ min, max, step, readOnly }}
            inputRef={ref}
            style={{ width: 100, textAlign: 'center' }}
        />
    );
});

export default NumberTextFieldUpDown;
