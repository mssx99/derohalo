import React, { ReactNode, useMemo } from 'react';
import { SxProps } from '@mui/system';
import NumberTextField from './NumberTextField';
import { NumericFormat, NumberFormatValues } from 'react-number-format';
import { formatUsd } from 'helpers/FormatHelper';
import { useDeroPrice } from 'helpers/ExchangeHelper';
import { usePreferences } from 'hooks/mainHooks';
import reactStringReplace from 'react-string-replace';
import DeroAmount from './DeroAmount';

export interface IDeroAmountField {
    sx?: SxProps;
    label?: ReactNode;
    disabled?: boolean;
    readOnly?: boolean;
    fullWidth?: boolean;
    helperText?: ReactNode;
    error?: boolean;
    hiddenLabel?: boolean;
    decimalScale?: number;
    suffix?: string;
    allowNegative?: boolean;
    value: number;
    onValueChange?: (value: number) => void;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isAllowed?: (values: NumberFormatValues) => boolean;
    preferUsd?: boolean;
}

const DeroAmountField = React.forwardRef<HTMLInputElement, IDeroAmountField>(
    ({ sx = { width: '16rem', maxWidth: '100%' }, decimalScale = 5, value, suffix = 'Deros', helperText, disabled = false, readOnly = false, onValueChange, preferUsd = false, ...props }, ref) => {
        const decimalValue = value / 100000;

        const { displayInUsd } = usePreferences();
        const deroPrice = useDeroPrice();

        const helperTextMemo = useMemo(() => {
            if (!displayInUsd) return helperText;

            let description: string;

            return helperText ? (
                <>
                    {helperText} -
                    <DeroAmount value={value} onlyText preferUsd />
                </>
            ) : (
                <DeroAmount value={value} onlyText preferUsd />
            );
        }, [helperText, value, displayInUsd, deroPrice]);

        return (
            <NumberTextField
                ref={ref}
                thousandSeparator
                sx={sx}
                decimalScale={decimalScale}
                suffix={suffix}
                {...props}
                helperText={helperTextMemo}
                value={decimalValue}
                disabled={disabled}
                readOnly={readOnly}
                onValueChange={(numberFormatValues: NumberFormatValues) => {
                    onValueChange && onValueChange(numberFormatValues.floatValue ? Math.round(numberFormatValues.floatValue * 100000) : 0);
                }}
            />
        );
    }
);

export default DeroAmountField;
