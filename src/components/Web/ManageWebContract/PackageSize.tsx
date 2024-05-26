import React from 'react';
import NumberTextFieldUpDown from 'components/common/NumberTextFieldUpDown';

interface IPackageSize {
    value: Uint64;
    onChange: (value: Uint64) => void;
    readOnly?: boolean;
}

const PackageSize: React.FC<IPackageSize> = ({ value, onChange, readOnly = false }) => {
    return <NumberTextFieldUpDown label="Package Size in Blocks" value={value} onChange={onChange} min={1} max={150000000} sx={{ minWidth: 200 }} readOnly={readOnly} />;
};

export default PackageSize;
