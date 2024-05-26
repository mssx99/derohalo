import React, { useState, ClipboardEvent, useEffect, useRef, useCallback } from 'react';
import Button from '@mui/material/Button';
import TextField from 'components/common/TextField';
import Compressor from 'compressorjs';
import { styled } from '@mui/material/styles';
import { fileOrBlobToBase64 } from 'helpers/Helper';
import { chatSendBinary } from 'helpers/ChatHelper';
import ChatList from './ChatList';
import ChatMessages from './ChatMessages';

const Container = styled('div')`
    position: absolute;
    top: 0px;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: row;
`;

const Chat: React.FC = () => {
    return (
        <Container>
            <ChatList />
            <ChatMessages />
        </Container>
    );
};

export default Chat;
