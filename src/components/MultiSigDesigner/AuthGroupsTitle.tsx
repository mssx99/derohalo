import React from 'react';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import { addAuthGroup, useContract } from 'hooks/multiSigHooks';
import { useArrowContext } from 'contexts/MultiSigArrowContext';

const AuthGroupsTitle: React.FC = () => {
    const { isLoaded } = useContract();
    const { updateArrows } = useArrowContext();

    const clickHandler = () => {
        addAuthGroup();
        updateArrows();
    };

    return (
        <>
            Authorization Groups
            {!isLoaded && (
                <IconButton size="small" onClick={clickHandler}>
                    <AddIcon fontSize="inherit" />
                </IconButton>
            )}
        </>
    );
};

export default AuthGroupsTitle;
