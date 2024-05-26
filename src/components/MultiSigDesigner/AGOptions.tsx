import React, { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import SwitchWithLabel from 'components/common/SwitchWithLabel';
import { useContract, useReorder } from 'hooks/multiSigHooks';

const Container = styled('div')({
    position: 'absolute',
    top: 5,
    right: 20,
});

const AGOptions: React.FC = () => {
    const { isLoaded } = useContract();
    const { reorder, setReorder } = useReorder();

    useEffect(() => {
        if (isLoaded) setReorder(false);
    }, [isLoaded]);

    const handleChange = (checked: boolean) => {
        setReorder(checked);
    };

    if (isLoaded) return <></>;

    return (
        <Container>
            <SwitchWithLabel
                inputProps={{ 'aria-label': 'Allows reordering of the Authorization-Groups.' }}
                size="small"
                label="Reorder"
                labelPlacement="start"
                checked={reorder}
                onChange={handleChange}
            />
        </Container>
    );
};

export default AGOptions;
