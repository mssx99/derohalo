import React from 'react';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import { addInvolvedParty, useContract } from 'hooks/multiSigHooks';
import { useArrowContext } from 'contexts/MultiSigArrowContext';

const InvolvedPartiesTitle: React.FC = () => {
    const { isLoaded } = useContract();
    const { updateArrows } = useArrowContext();

    const clickHandler = () => {
        addInvolvedParty();
        updateArrows();
    };

    return (
        <>
            Involved Parties
            {!isLoaded && (
                <IconButton size="small" onClick={clickHandler}>
                    <AddIcon fontSize="inherit" />
                </IconButton>
            )}
        </>
    );
};

export default InvolvedPartiesTitle;
