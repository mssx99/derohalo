import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { HeaderTitle, SubTitle } from 'components/common/TextElements';
import CurrentWebContract from './CurrentWebContract';
import { useContract, useIsWebOwner } from 'hooks/webHooks';
import ManageWebContract from './ManageWebContract';
import CodeDisplay from 'components/common/CodeDisplay';
import PendingApprovals from './PendingApprovals';

const Container = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const Web: React.FC = () => {
    const contract = useContract();
    const isWebOwner = useIsWebOwner();

    return (
        <Container>
            <HeaderTitle>Web-SmartContract-Settings</HeaderTitle>
            <div className="previewContainer">
                <div className="configurator">
                    <CurrentWebContract />
                    <ManageWebContract />
                    {isWebOwner && <PendingApprovals />}
                </div>
                <CodeDisplay className="contract" show={true} title="Used WebContract" code={contract?.code ?? ''} />
            </div>
        </Container>
    );
};

export default Web;
