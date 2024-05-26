import React from 'react';
import { styled } from '@mui/material/styles';
import { useContract } from 'hooks/guaranteeHooks';
import ImagesPanel from 'components/GuaranteeDesigner/ImagesPanel';

const Container = styled('div')`
    flex: 1;
    position: relative;
    display: flex;
    border-radius: 5px;
    overflow: hidden;
    background-color: #d0cdcd70;
`;

const StateContainer = styled('div')`
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 5px;
    z-index: 0;
    pointer-events: none;
`;

const Title = styled('div')`
    font-size: 0.8rem;
`;

const CurrentState = styled('div')`
    font-size: 2rem;
`;

const State: React.FC = () => {
    const { contract } = useContract();

    return (
        <Container>
            <ImagesPanel />
            <StateContainer>
                <Title>State</Title>
                <CurrentState className="blackTextShadow">{contract.state}</CurrentState>
            </StateContainer>
        </Container>
    );
};

export default State;
