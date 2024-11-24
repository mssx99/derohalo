import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Tooltip from '@mui/material/Tooltip';

import { styled } from '@mui/material/styles';
import { setCurrentChat, useChats, useCurrentChatIndex } from 'hooks/chatHooks';
import ChatListDetails from './ChatListDetails';
import { shortenScid } from 'helpers/DeroHelper';
import { Small } from 'components/common/TextElements';
import DeroAmount from 'components/common/DeroAmount';
import { scrollToChatBottom } from 'helpers/ChatHelper';
import HaloButtonWebsite from '../HaloButtonWebsite';

const Container = styled('div')`
    background-color: #0000008a;
    padding: 5px;
    flex-basis: 300px;
`;

const ChatList: React.FC = () => {
    const currentChat = useCurrentChatIndex();
    const chats = useChats();

    const handleChange = (newCurrentChat: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        // setCurrentChat({ index: newCurrentChat });
        scrollToChatBottom(true, newCurrentChat);
    };

    return (
        <Container>
            <HaloButtonWebsite />
            {chats.map((chat, index) => (
                <Accordion key={chat.otherParty ? chat.otherParty.address : 'All'} expanded={currentChat === index} onChange={handleChange(index)}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1bh-content" id="panel1bh-header">
                        <Title chat={chat} />
                    </AccordionSummary>
                    <AccordionDetails>
                        <ChatListDetails chat={chat} />
                    </AccordionDetails>
                </Accordion>
            ))}
        </Container>
    );
};

interface ITitle {
    chat: IChat;
}

const TitleContainer = styled('div')`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const TitleRow = styled('div')`
    position: relative;

    & div {
        max-width: 50%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
`;

const EarnedTag = styled(DeroAmount)`
    position: absolute;
    right: -5px;
    top: -20px;
    color: white;
    font-size: 13px;
    text-shadow: 0 0 10px rgba(0, 255, 0, 1), 0 0 20px rgba(0, 255, 0, 1), 0 0 30px rgba(0, 255, 0, 1), 0 0 40px rgba(0, 255, 0, 1);
    padding: 20px;
    border-radius: 10px;
`;

const LostTag = styled(DeroAmount)`
    position: absolute;
    right: -5px;
    top: -20px;
    color: white;
    font-size: 13px;
    text-shadow: 0 0 10px rgba(255, 0, 0, 1), 0 0 20px rgba(255, 0, 0, 1), 0 0 30px rgba(255, 0, 0, 1), 0 0 40px rgba(255, 0, 0, 1);
    padding: 20px;
    border-radius: 10px;
`;

const AddressRow = styled(Small)`
    max-width: 230px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    direction: rtl;
    text-align: left;
`;

const Title: React.FC<ITitle> = ({ chat }) => {
    const alias = chat.otherParty ? (chat.otherParty?.alias ? chat.otherParty?.alias : '<Unknown>') : 'All';
    const address = chat.otherParty?.address ? chat.otherParty?.address : '(displays all messages)';

    return (
        <TitleContainer>
            <TitleRow>
                <Tooltip title={alias} followCursor>
                    <div>{alias}</div>
                </Tooltip>
                {chat.totalReceived > chat.totalSent ? <EarnedTag value={chat.totalReceived - chat.totalSent} preferUsd /> : <LostTag value={chat.totalReceived - chat.totalSent} preferUsd />}
            </TitleRow>
            <AddressRow>{address}</AddressRow>
        </TitleContainer>
    );
};

export default ChatList;
