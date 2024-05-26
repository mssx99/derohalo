import React, { forwardRef, ReactNode, useMemo } from 'react';
import { useDeroPrice } from 'helpers/ExchangeHelper';
import { usePreferences } from 'hooks/mainHooks';
import { Body } from './TextElements';
import { formatDeroAmount } from 'helpers/FormatHelper';
import { TypographyProps } from '@mui/material/Typography';

interface IDeroAmount extends TypographyProps {
    value: Uint64;
    onlyText?: boolean;
    onlyUsd?: boolean;
    preferUsd?: boolean;
}

const DeroAmount = forwardRef<HTMLElement | null, IDeroAmount>(({ value, onlyText = true, onlyUsd = false, preferUsd = false, ...otherProps }: IDeroAmount, ref) => {
    const { displayInUsd } = usePreferences();
    const deroPrice = useDeroPrice();

    const displayedValue = useMemo(() => formatDeroAmount(value, onlyUsd, deroPrice, preferUsd, displayInUsd), [value, onlyUsd, deroPrice, displayInUsd]);

    if (onlyUsd && !displayInUsd) return null;

    if (onlyText) {
        return (
            <span ref={ref} className={otherProps.className}>
                {displayedValue}
            </span>
        );
    }

    return (
        <Body ref={ref} {...otherProps}>
            {displayedValue}
        </Body>
    );
});

export default DeroAmount;
