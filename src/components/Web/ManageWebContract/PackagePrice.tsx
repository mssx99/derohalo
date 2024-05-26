import DeroAmountField from 'components/common/DeroAmountField';
import React from 'react';

interface IPackagePrice {
    value: Uint64;
    onChange: (value: Uint64) => void;
    readOnly?: boolean;
}

const PackagePrice: React.FC<IPackagePrice> = ({ value, onChange, readOnly = false }) => {
    return <DeroAmountField label="Package Price" value={value} onValueChange={onChange} sx={{ width: '20ch' }} readOnly={readOnly} />;
};

export default PackagePrice;
