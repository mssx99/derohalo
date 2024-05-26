import React, { ReactNode, useCallback, useId } from 'react';
import { NumericFormat, NumberFormatValues } from 'react-number-format';
import FilledInput from '@mui/material/FilledInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { SxProps } from '@mui/system';

interface INumberTextField {
    id?: string;
    sx?: SxProps;
    label?: ReactNode;
    hiddenLabel?: boolean;
    error?: boolean;
    helperText?: ReactNode;
    decimalScale?: number;
    suffix?: string;
    thousandSeparator?: boolean;
    allowNegative?: boolean;
    value?: string | number;
    onValueChange?: (event: NumberFormatValues) => void;
    onIntegerChange?: (value: number) => void;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isAllowed?: (values: NumberFormatValues) => boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
}

interface MyNumericProps {
    thousandSeparator?: boolean | string;
    decimalSeparator?: string;
    allowedDecimalSeparators?: Array<string>;
    thousandsGroupStyle?: 'thousand' | 'lakh' | 'wan' | 'none';
    decimalScale?: number;
    fixedDecimalScale?: boolean;
    allowNegative?: boolean;
    allowLeadingZeros?: boolean;
    suffix?: string;
    prefix?: string;
    defaultValue?: string | number | readonly string[] | undefined;
    isAllowed?: (values: NumberFormatValues) => boolean;
}

const NumericFormatter = React.forwardRef<HTMLInputElement, MyNumericProps>(({ suffix, defaultValue, ...props }, ref) => {
    return <NumericFormat getInputRef={ref} suffix={suffix ? ` ${suffix}` : ''} {...props} />;
});

const NumberTextField = React.forwardRef<HTMLInputElement, INumberTextField>(
    (
        {
            id,
            sx,
            label,
            hiddenLabel,
            error,
            helperText,
            decimalScale,
            suffix,
            thousandSeparator,
            allowNegative,
            onValueChange,
            onIntegerChange,
            onChange,
            isAllowed,
            value,
            disabled,
            readOnly,
            ...otherProps
        },
        ref
    ) => {
        const inputId = useId();

        const handleOnValueChange = useCallback(
            (nfv: NumberFormatValues) => {
                if (onValueChange) {
                    onValueChange(nfv);
                }
                if (onIntegerChange) {
                    const value = parseInt(nfv.value);
                    if (isNaN(value)) {
                        onIntegerChange(0);
                    } else {
                        onIntegerChange(value);
                    }
                }
            },
            [onValueChange, onIntegerChange]
        );

        return (
            <FormControl id={id} sx={sx} variant="filled" error={error} {...otherProps}>
                <InputLabel htmlFor={id}>{label}</InputLabel>
                <FilledInput
                    id={inputId}
                    inputRef={ref}
                    hiddenLabel={hiddenLabel}
                    inputComponent={NumericFormatter}
                    inputProps={{ decimalScale, suffix, thousandSeparator, allowNegative: allowNegative ? true : false, onValueChange: handleOnValueChange, onChange, isAllowed }}
                    value={value}
                    disabled={disabled}
                    readOnly={readOnly}
                    aria-describedby={helperText ? `${inputId}-helper-text` : undefined}
                />
                {helperText && <FormHelperText id={`${inputId}-helper-text`}>{helperText}</FormHelperText>}
            </FormControl>
        );
    }
);

export default NumberTextField;
