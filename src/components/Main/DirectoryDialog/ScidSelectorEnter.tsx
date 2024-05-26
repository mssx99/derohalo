import React, { useState } from 'react';
import ScidSelector from 'components/common/ScidSelector';

interface IScidSelectorEnter {
    label?: string;
    value: ISmartContractDirectoryEntry | string | null;
    type: SmartContractType;
    onEnter: (scid: string | null) => void;
}

const ScidSelectorEnter: React.FC<IScidSelectorEnter> = ({ label, value: receivedValue, type, onEnter }) => {
    const [value, setValue] = useState<ISmartContractDirectoryEntry | string | null>(receivedValue || '');

    const handleEnter = (newValue: ISmartContractDirectoryEntry | string | null) => {
        setValue(newValue);

        const scid = typeof newValue === 'object' ? newValue?.scid ?? null : newValue;
        onEnter(scid);
    };

    const handleChange = (value: ISmartContractDirectoryEntry | string | null, verified: boolean) => {
        setValue(value ?? null);
    };

    return <ScidSelector label={label} value={value} onChange={handleChange} onEnter={handleEnter} sx={{ maxWidth: null }} type={type} noOptions noFavoriteIndicator />;
};

export default ScidSelectorEnter;
