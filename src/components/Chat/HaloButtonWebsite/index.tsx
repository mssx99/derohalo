import React, { useMemo } from 'react';
import { styled } from '@mui/material/styles';
import HaloButtonPreview from './HaloButtonPreview';
import { Small } from 'components/common/TextElements';
import { useHaloButtonDialog } from './HaloButtonDialog';

const Container = styled('div')`
    display: flex;
    align-items: center;
    justify-items: center;
    gap: 10px;

    & > button {
        margin: 10px 0;
    }
`;

const Description = styled('div')`
    flex-grow: 1;
    padding-left: 10px;
`;

const HaloButtonWebsite: React.FC = () => {
    const { setOpen } = useHaloButtonDialog();

    const handleClick = () => {
        setOpen(true);
    };

    return (
        <Container>
            <Description className="blackTextShadow">
                Get the Button for your Website. <Small>Click for more info.</Small>
            </Description>
            <HaloButtonPreview percentage={50} onClick={handleClick} tooltipText="Click here for a dialog to create your own derohalo button for your website" />
        </Container>
    );
};

export default HaloButtonWebsite;
