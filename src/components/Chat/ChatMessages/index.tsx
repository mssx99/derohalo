import React from 'react';
import TextField from 'components/common/TextField';
import { styled } from '@mui/material/styles';
import DisplayMessages from './DisplayMessages';
import ChatSelectorInfo from './ChatSelectorInfo';
import SendMessage from './SendMessage';

const Container = styled('div')`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const ChatMessages: React.FC = () => {
    return (
        <Container>
            <ChatSelectorInfo />
            <DisplayMessages />
            <SendMessage />
        </Container>
    );
};

export default ChatMessages;
