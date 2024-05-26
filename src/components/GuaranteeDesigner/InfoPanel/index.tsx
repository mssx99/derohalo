import React from 'react';
import { styled } from '@mui/material/styles';
import Party from './Party';
import { setFirstPartyWallet, setSecondPartyWallet, useContract } from 'hooks/guaranteeHooks';
import Description from './Description';

const Container = styled('div')`
    display: flex;
    flex-direction: row;
    flex: 1;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
`;

const InfoPanel: React.FC = () => {
    const { contract } = useContract();

    return (
        <Container>
            <Party value="A" />
            <Description />
            <Party value="B" />
        </Container>
    );
};

export default InfoPanel;
