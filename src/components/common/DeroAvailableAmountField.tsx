import React, { useMemo, useState, useEffect } from 'react';
import DeroAmountField, { IDeroAmountField } from './DeroAmountField';
import { useWalletBalance } from 'hooks/deroHooks';
import DeroAmount from './DeroAmount';
import reactStringReplace from 'react-string-replace';

const DeroAvailableAmountField = React.forwardRef<HTMLInputElement, IDeroAmountField>(
    ({ sx = { width: 300, maxWidth: '100%' }, decimalScale = 5, value, suffix = 'Deros', helperText, disabled = false, readOnly = false, onValueChange, ...props }, ref) => {
        const walletBalance = useWalletBalance();
        const [amount, setAmount] = useState<number>(value);
        const [error, setError] = useState<boolean>(walletBalance < amount);

        useEffect(() => {
            setAmount(value);
        }, [value]);

        const helperTextMemo = useMemo(() => {
            const available = walletBalance - amount;
            return helperText ? (
                <>
                    {helperText} - Available: <DeroAmount value={available} onlyText />
                </>
            ) : (
                <>
                    Available: <DeroAmount value={available} onlyText />
                </>
            );
        }, [helperText, walletBalance, amount]);

        useEffect(() => {
            setError(walletBalance < amount);
        }, [walletBalance, amount]);

        return (
            <DeroAmountField
                ref={ref}
                sx={sx}
                decimalScale={decimalScale}
                value={amount}
                suffix={suffix}
                helperText={helperTextMemo}
                error={props.error || error}
                onValueChange={(amount: Uint64) => {
                    setAmount(amount);
                    onValueChange && onValueChange(amount);
                }}
                disabled={disabled}
                readOnly={readOnly}
                {...props}
            />
        );
    }
);

export default DeroAvailableAmountField;
