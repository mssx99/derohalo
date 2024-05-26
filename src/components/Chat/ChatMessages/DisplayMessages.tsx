import React, { useCallback, useRef, useState } from 'react';

import { styled } from '@mui/material/styles';
import { useCurrentChat, useCurrentChatMinimum } from 'hooks/chatHooks';
import Message from './Message';
import { useEventListener } from 'hooks/customHooks';

interface ContainerProps {
    isAll: boolean;
}

const Container = styled('div')<ContainerProps>`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0 8px;
    flex-grow: 1;
    overflow-y: auto;
    padding-right: 6px;
    margin-right: 2px;
    padding-top: 10px;
    padding-bottom: 10px;
`;

export const CHAT_SCROLL_TO_BOTTOM = 'CHATscrollToBottom';

const DisplayMessages: React.FC = () => {
    const currentChat = useCurrentChat();
    const currentChatMinimum = useCurrentChatMinimum();

    const handleScrollToBottom = useCallback(
        (event: CustomEvent<IEventChatScrollToBottom>) => {
            const address = event.detail.address;
            const txid = event.detail.txid;

            let run = false;
            if (address && currentChat && address === currentChat.otherParty?.address) {
                run = true;
            } else if (!address && currentChat && currentChat.otherParty == null) {
                run = true;
            } else {
                run = true;
            }

            if (run) {
                if (txid) {
                    setTimeout(() => {
                        const element = document.querySelector(`[data-txid='${txid}']`);
                        if (element) {
                            element.scrollIntoView();
                        }
                    }, 0);
                } else {
                    setTimeout(() => {
                        const element = document.getElementById('messageDisplay');
                        if (element) {
                            element.scrollTop = element.scrollHeight;
                        }
                    }, 0);
                }
            }
        },
        [currentChat]
    );

    useEventListener<IEventChatScrollToBottom>(CHAT_SCROLL_TO_BOTTOM, handleScrollToBottom);

    if (currentChat === null) return <></>;

    return (
        <Container id="messageDisplay" isAll={currentChat.otherParty === null}>
            {currentChat.messages
                .filter((m) => currentChatMinimum <= m.amountSent || !m.wasReceived)
                .map((m) => (
                    <Message key={m.tempId} value={m} data-txid={m.startTxid ?? `TEMP_${m.tempId}`} />
                ))}
        </Container>
    );
};

export default DisplayMessages;
