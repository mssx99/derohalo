import React, { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import SwitchWithLabel from 'components/common/SwitchWithLabel';
import { useDisplayBlocks } from 'hooks/guaranteeHooks';

const Container = styled('div')({
    position: 'absolute',
    top: 5,
    right: 20,
});

const BlockOptions: React.FC = () => {
    const { displayBlocks, setDisplayBlocks } = useDisplayBlocks();

    const handleChange = (checked: boolean) => {
        setDisplayBlocks(checked);
    };

    return (
        <Container>
            <SwitchWithLabel
                inputProps={{ 'aria-label': 'Display as blocks or estimated date.' }}
                size="small"
                label="Display as blocks"
                labelPlacement="start"
                checked={displayBlocks}
                onChange={handleChange}
            />
        </Container>
    );
};

export default BlockOptions;
