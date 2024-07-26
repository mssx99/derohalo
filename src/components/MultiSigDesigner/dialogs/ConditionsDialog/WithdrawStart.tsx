import React, { useState, useCallback, useMemo, useEffect } from 'react';
import BlockheightSelector, { IBlockHeightSelectorReturnValue } from 'components/common/BlockHeightSelector';

interface IWithdrawStart {
    value: Uint64 | undefined;
    readOnly?: boolean;
    onChange: (blocks: Uint64) => void;
}

const WithdrawStart: React.FC<IWithdrawStart> = ({ value, readOnly, onChange }) => {
    const [blocks, setBlocks] = useState(0);

    const helperText = useMemo(() => {
        if (!blocks) return 'The group will be able to withdraw right away.';
        if (blocks == 1) return 'The group will be able to withdraw after waiting for one block. Count starts after SmartContract-Install.';
        return `The group will be able to withdraw after waiting for a ${blocks} blocks. Count starts after SmartContract-Install.`;
    }, [blocks]);

    useEffect(() => {
        setBlocks(value ?? 0);
    }, [value]);

    const handleChange = useCallback(
        ({ blocks, date }: IBlockHeightSelectorReturnValue) => {
            setBlocks(blocks);
            onChange(blocks);
        },
        [onChange]
    );

    return <BlockheightSelector value={value} label="Withdrawal possible after" helperText={helperText} readOnly={readOnly} onChange={handleChange} />;
};

export default WithdrawStart;
