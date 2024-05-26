import React from 'react';
import { styled } from '@mui/material/styles';
import { useIsConnected, useSmartContractDeroBalance } from 'hooks/deroHooks';
import DeroAmount from 'components/common/DeroAmount';
import { SubTitle } from 'components/common/TextElements';

interface ISmartContractBalance {
    type: SmartContractType;
}

const Container = styled('div')`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
`;

const SmartContractBalance: React.FC<ISmartContractBalance> = ({ type }) => {
    const balance = useSmartContractDeroBalance(type);
    const isConnected = useIsConnected();

    if (isNaN(balance) || !isConnected) {
        return <></>;
    }
    return (
        <Container>
            <SubTitle className="blackTextShadow">Balance</SubTitle>
            <DeroAmount className="blackTextShadow" value={balance} />
        </Container>
    );
};

export default SmartContractBalance;
