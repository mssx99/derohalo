import React from 'react';
import TextField from 'components/common/TextField';
import { setDescription, useContract } from 'hooks/guaranteeHooks';

const Responsabilities: React.FC = () => {
    const { isNew, contract } = useContract();

    const handleChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(value);
    };

    return (
        <TextField label="Responsabilities of each Party" value={contract.description ?? (isNew ? '' : 'No responsabilities defined.')} onChange={handleChange} readOnly={!isNew} multiline fullWidth />
    );
};

export default Responsabilities;
