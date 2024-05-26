import React from 'react';
import { styled } from '@mui/material/styles';

interface ITextMessage {
    value: IChatMessage;
}

const Container = styled('div')`
    white-space: pre-wrap;
`;

const TextMessage: React.FC<ITextMessage> = ({ value: message }) => {
    return <Container>{message.content}</Container>;
};

export default TextMessage;
