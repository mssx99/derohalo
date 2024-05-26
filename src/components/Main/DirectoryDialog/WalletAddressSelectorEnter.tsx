import WalletAddressSelector from 'components/common/WalletAddressSelector';
import React, { useState, useCallback } from 'react';

interface IWalletAdressSelectorEnter {
    value: IWalletDirectoryEntry | string | null;
    onEnter: (address: string | null) => void;
}

const WalletAddressSelectorEnter: React.FC<IWalletAdressSelectorEnter> = ({ value: receivedValue, onEnter }) => {
    const [value, setValue] = useState<IWalletDirectoryEntry | string | null>(receivedValue || '');

    const handleEnter = useCallback(
        (newValue: IWalletDirectoryEntry | string | null) => {
            setValue(newValue);

            const address = typeof newValue === 'object' ? newValue?.address ?? null : newValue;
            onEnter(address);
        },
        [onEnter]
    );

    const handleAddressChange = (value: IWalletDirectoryEntry | string | null, verified: boolean) => {
        setValue(value);
    };

    return <WalletAddressSelector value={value} onChange={handleAddressChange} onEnter={handleEnter} noOptions noFavoriteIndicator />;
};

export default WalletAddressSelectorEnter;
