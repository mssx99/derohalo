import React from 'react';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { setContract, setGuaranteeSmartContractBalances, setIsNew, useContract } from 'hooks/guaranteeHooks';
import { createNewGuaranteeContract } from 'helpers/ContractHelper';
import LocalStorage from 'browserStorage/localStorage';

const NewOrExistingRadio: React.FC = () => {
    const { isNew, contract } = useContract();

    const handleChangeRadio = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isNew = (event.target as HTMLInputElement).value === 'new';
        setIsNew(isNew);
        if (isNew && contract.scid) {
            const contract = createNewGuaranteeContract();
            setContract(contract);
            setGuaranteeSmartContractBalances({});
        }

        if (isNew) {
            LocalStorage.clearLastOpenedGuaranteeContract();
        }
    };

    return (
        <RadioGroup row aria-labelledby="demo-row-radio-buttons-group-label" name="row-radio-buttons-group" value={isNew ? 'new' : 'existing'} onChange={handleChangeRadio}>
            <FormControlLabel value="new" control={<Radio />} label="New" />
            <FormControlLabel value="existing" control={<Radio />} label="Existing" />
        </RadioGroup>
    );
};

export default NewOrExistingRadio;
