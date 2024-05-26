import NumberTextField from 'components/common/NumberTextField';
import SwitchWithLabel from 'components/common/SwitchWithLabel';
import { usePreferences } from 'hooks/mainHooks';
import React from 'react';
import { NumberFormatValues } from 'react-number-format';
import { styled } from '@mui/material/styles';
import LocalStorage from 'browserStorage/localStorage';

const Container = styled('div')({
    height: 50,
    width: 400,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
});

const DisplayUsdControls: React.FC = () => {
    const { displayInUsd, setDisplayInUsd, updateFrequencyUsd, setUpdateFrequencyUsd } = usePreferences();

    const handleDisplayChange = (checked: boolean) => {
        setDisplayInUsd(checked);
        LocalStorage.setDisplayInUsd(checked);
    };

    const handleFrequencyValueChange = ({ value }: NumberFormatValues) => {
        const updateFrequency = parseInt(value);
        setUpdateFrequencyUsd(updateFrequency);
        LocalStorage.setUsdUpdateFrequency(updateFrequency);
    };

    const isAllowed = ({ value }: NumberFormatValues) => {
        const v = parseInt(value);
        if (v < 10) return false;
        return true;
    };

    return (
        <Container>
            <SwitchWithLabel label="Display in USD" checked={displayInUsd} onChange={handleDisplayChange} />
            {displayInUsd && (
                <NumberTextField
                    label="Update every"
                    thousandSeparator
                    sx={{ width: 150, maxWidth: '100%' }}
                    value={updateFrequencyUsd}
                    onValueChange={handleFrequencyValueChange}
                    isAllowed={isAllowed}
                    suffix={'seconds'}
                />
            )}
        </Container>
    );
};

export default DisplayUsdControls;
