import React from 'react';
import MuiTextField, { TextFieldProps } from '@mui/material/TextField';

export type ITextField = { readOnly?: boolean } & TextFieldProps;

const TextField = React.forwardRef<HTMLInputElement, ITextField>(({ readOnly = false, ...props }, ref) => {
    return (
        <MuiTextField
            inputRef={ref}
            InputProps={{
                readOnly: readOnly,
            }}
            {...props}
            variant="filled"
        />
    );
});

export default TextField;
