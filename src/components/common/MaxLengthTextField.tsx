import React, { useState, useEffect } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

export type MaxLengthTextFieldProps = { charLimit?: number } & TextFieldProps;

const MaxLengthTextField = React.forwardRef<HTMLInputElement, MaxLengthTextFieldProps>((props, ref) => {
    const { charLimit = 50, value, onChange: onPriorChange, ...otherProps } = props;
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (typeof value === 'string') {
            setInputValue(value);
        } else {
            setInputValue('');
        }
    }, [value]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        if (onPriorChange) {
            onPriorChange(event);
        }
    };

    const charsLeft = charLimit - inputValue.length;

    return (
        <TextField
            variant="filled"
            {...otherProps}
            helperText={`${charsLeft} characters left`}
            value={inputValue}
            onChange={handleInputChange}
            inputProps={{ maxLength: charLimit, ...props.inputProps }}
            ref={ref}
        />
    );
});

export default MaxLengthTextField;
