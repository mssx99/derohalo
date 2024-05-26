import React, { useState, useEffect } from 'react';
import DeroAmountField from 'components/common/DeroAmountField';
import SwitchWithLabel from 'components/common/SwitchWithLabel';

interface IMaximumWithdrawal {
    value: Uint64 | undefined;
    readOnly?: boolean;
    onChange: (maximumWithdrawal: Uint64) => void;
}

const MaximumWithdrawal = React.forwardRef<HTMLInputElement, IMaximumWithdrawal>(({ value: maximumWithdrawal, onChange, readOnly = false }, ref) => {
    if (!maximumWithdrawal) maximumWithdrawal = -1;
    const [checked, setChecked] = useState<boolean>(maximumWithdrawal > -1);
    const [value, setValue] = useState<Uint64>(maximumWithdrawal ?? -1);

    const helperText = checked && value === -1 ? 'Set the value to more than 0 in order to apply a withdrawal limit.' : undefined;

    const handleSwitchChange = (checked: boolean) => {
        if (!checked) {
            setValue(-1);
        }
        setChecked(checked);
    };

    useEffect(() => {
        if (maximumWithdrawal != value) {
            setValue(maximumWithdrawal ?? 0);
            setChecked(maximumWithdrawal != null);
        }
    }, [maximumWithdrawal]);

    return (
        <>
            <SwitchWithLabel label="Withdrawal Limit" checked={checked} onChange={handleSwitchChange} disabled={readOnly} />
            <DeroAmountField
                label="Maximum Withdrawal"
                value={value > -1 ? value : 0}
                onValueChange={(newMaximumWithdrawal: Uint64) => {
                    setValue(newMaximumWithdrawal ?? 0);
                    onChange(newMaximumWithdrawal);
                }}
                readOnly={readOnly}
                disabled={!checked}
                helperText={helperText}
            />
        </>
    );
});

export default MaximumWithdrawal;
