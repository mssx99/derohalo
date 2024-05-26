import React from 'react';
import ChatButton from 'components/common/ChatButton';
import { styled } from '@mui/material/styles';
import NoMaxWidthTooltip from 'components/common/NoMaxWidthTooltip';

interface IPartyDisplay {
    address: string | null;
}

const Container = styled('div')`
    display: flex;
    flex-direction: column;
    min-width: 0;

    & button {
        align-self: center;
    }
`;

const AddressContainer = styled('div')`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    direction: rtl;
    text-align: left;
`;

const PartyDisplay: React.FC<IPartyDisplay> = ({ address }) => {
    return (
        <NoMaxWidthTooltip title={address} followCursor>
            <Container>
                <AddressContainer>{address}</AddressContainer>

                <ChatButton walletAddress={address} />
            </Container>
        </NoMaxWidthTooltip>
    );
};

export default PartyDisplay;
