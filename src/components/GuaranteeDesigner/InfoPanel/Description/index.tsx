import React from 'react';
import { styled, css } from '@mui/material/styles';
import TextField from 'components/common/TextField';
import Form, { FormElement } from 'components/common/Form';
import { useContract } from 'hooks/guaranteeHooks';
import Responsabilities from './Responsabilities';
import State from './State';

const Container = styled('div')(css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 200px;
    gap: 10px;

    @media (max-width: 80rem) {
        order: 3;
        flex-basis: 100%;
    }
`);

const Description: React.FC = () => {
    return (
        <Container>
            <State />
            <Responsabilities />
        </Container>
    );
};

export default Description;
