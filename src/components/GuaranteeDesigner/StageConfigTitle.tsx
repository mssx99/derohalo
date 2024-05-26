import React from 'react';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import { addStage, useContract } from 'hooks/guaranteeHooks';
import { createGuaranteeStage } from 'helpers/ContractHelper';

const StageConfigTitle: React.FC = () => {
    const { isLoaded } = useContract();

    const clickHandler = () => {
        addStage();
    };

    return (
        <>
            Stages
            {!isLoaded && (
                <IconButton size="small" onClick={clickHandler}>
                    <AddIcon fontSize="inherit" />
                </IconButton>
            )}
        </>
    );
};

export default StageConfigTitle;
