import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import DeroAmountField from 'components/common/DeroAmountField';
import NumberTextField from 'components/common/NumberTextField';
import { NumberFormatValues } from 'react-number-format';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { styled } from '@mui/material/styles';

interface IPublishFee {
    valueFee: Uint64;
    valueMinimum: Uint64;
    onChange: (publishFee: Uint64, publishFeeMinimum?: Uint64) => void;
    readOnly?: boolean;
    maxPercentage?: number;
    maxMinimum?: number;
    maxAbsolute?: number;
}

const Row = styled('div')`
    display: flex;
    flex-direction: row;
    gap: 10px;
`;

const SubRow = styled('div')`
    display: flex;
    flex-direction: row;
    gap: 10px;
`;

type FeeType = 'percentage' | 'absolute';

const PublishFee: React.FC<IPublishFee> = ({ valueFee, valueMinimum, onChange, readOnly = false, maxPercentage = 100000000, maxMinimum = 2100000000000, maxAbsolute = 2100000000000 }) => {
    const [type, setType] = useState<FeeType>(valueFee <= maxPercentage ? 'percentage' : 'absolute');
    const [percentage, setPercentage] = useState(valueFee <= maxPercentage ? valueFee / 1000 : 500);
    const [absolute, setAbsolute] = useState(valueFee > maxPercentage ? (valueFee - maxPercentage - 1) / 100000 : 0);
    const [minimum, setMinimum] = useState(valueMinimum);

    const [userInitiated, setUserInitiated] = useState(false);
    const userInitiatedRef = useRef(userInitiated);

    const id_feeTypeLabel = useId();

    useEffect(() => {
        userInitiatedRef.current = userInitiated;
    }, [userInitiated]);

    useEffect(() => {
        const newType = valueFee <= maxPercentage ? 'percentage' : 'absolute';
        setType(newType);
        if (newType === 'percentage') {
            setPercentage(valueFee);
            setMinimum(valueMinimum);
        } else {
            setAbsolute(valueFee - maxPercentage - 1);
        }
    }, [valueFee, valueMinimum]);

    useEffect(() => {
        if (!userInitiatedRef.current) return;
        if (type === 'percentage') {
            onChange(percentage, minimum);
        } else {
            onChange(absolute + maxPercentage + 1);
        }
    }, [type, percentage, minimum, absolute]);

    const handleTypeChange = useCallback(({ target: { value } }: SelectChangeEvent<FeeType>) => {
        setUserInitiated(true);
        setType(value as FeeType);
    }, []);

    const handlePercentageChange = ({ floatValue }: NumberFormatValues) => {
        setUserInitiated(true);
        if (floatValue) {
            setPercentage(floatValue * 1000);
        } else {
            setPercentage(0);
        }
    };

    const handleMinimumChange = (value: Uint64) => {
        setUserInitiated(true);
        setMinimum(value);
    };

    const handleAbsoluteChange = (value: Uint64) => {
        setUserInitiated(true);
        setAbsolute(value);
    };

    const isPercentageAllowed = useCallback(
        ({ floatValue, formattedValue }: NumberFormatValues) => {
            if (!floatValue || !formattedValue) return true;
            return floatValue >= 0 && floatValue <= maxPercentage / 1000;
        },
        [maxPercentage]
    );

    const isMinimumAllowed = useCallback(
        ({ floatValue, formattedValue }: NumberFormatValues) => {
            if (!floatValue || !formattedValue) return true;
            return floatValue >= 0 && floatValue <= maxMinimum;
        },
        [maxMinimum]
    );

    const isAbsoluteAllowed = useCallback(
        ({ floatValue, formattedValue }: NumberFormatValues) => {
            if (!floatValue || !formattedValue) return true;
            return floatValue >= 0 && floatValue <= maxAbsolute;
        },
        [maxAbsolute]
    );

    return (
        <Row>
            {type === 'percentage' ? (
                <SubRow>
                    <NumberTextField
                        sx={{ width: '10ch' }}
                        label="Percentage"
                        value={percentage / 1000}
                        onValueChange={handlePercentageChange}
                        isAllowed={isPercentageAllowed}
                        decimalScale={3}
                        suffix="%"
                        readOnly={readOnly}
                    />
                    <DeroAmountField label="Minimum" sx={{ width: '20ch' }} value={minimum} onValueChange={handleMinimumChange} isAllowed={isMinimumAllowed} readOnly={readOnly} />
                </SubRow>
            ) : (
                <DeroAmountField label="Fixed" sx={{ width: '20ch' }} value={absolute} onValueChange={handleAbsoluteChange} isAllowed={isAbsoluteAllowed} readOnly={readOnly} />
            )}
            <FormControl variant="filled" sx={{ flexGrow: 1 }}>
                <InputLabel id={id_feeTypeLabel}>Fee-Type</InputLabel>
                <Select labelId={id_feeTypeLabel} value={type} onChange={handleTypeChange} readOnly={readOnly}>
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="absolute">Absolute Amount</MenuItem>
                </Select>
            </FormControl>
        </Row>
    );
};

export default PublishFee;
