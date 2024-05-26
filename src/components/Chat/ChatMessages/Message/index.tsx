import React, { useMemo, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import ImageMessage from './ImageMessage';
import TextMessage from './TextMessage';
import ProgressIndicator from './ProgressIndicator';
import DeroAmount from 'components/common/DeroAmount';
import { useCurrentChat } from 'hooks/chatHooks';
import { createGradient, interpolateColor, stringToColor } from 'helpers/ColorHelper';
import { CHATMESSAGE_COLOR_LOW } from 'Constants';
import { Small } from 'components/common/TextElements';
import dayjs from 'dayjs';
import { scrollToChatBottom } from 'helpers/ChatHelper';
import Tooltip from '@mui/material/Tooltip';
import NoMaxWidthTooltip from 'components/common/NoMaxWidthTooltip';
import AudioMessage from './AudioMessage';

interface IMessage {
    value: IChatMessage;
}

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    wasReceived: boolean;
}

const Container = styled('div', { shouldForwardProp: (prop: string) => !['wasReceived'].includes(prop) })<ContainerProps>`
    --align-self: ${(props) => (props.wasReceived ? 'flex-start' : 'flex-end')};
    --text-align: ${(props) => (props.wasReceived ? 'start' : 'end')};

    min-width: 150px;
    max-width: 60%;

    align-self: var(--align-self);
    text-align: var(--text-align);
`;

interface BackgroundBoxProps extends React.HTMLAttributes<HTMLDivElement> {
    amountColor: string;
    isAll: boolean;
}

const BackgroundBox = styled('div', { shouldForwardProp: (prop: string) => !['isAll', 'amountColor'].includes(prop) })<BackgroundBoxProps>`
    --border-radius-top: ${(props) => (props.isAll ? '0' : '5px')};
    position: relative;
    background-color: ${(props) => props.amountColor};
    border-radius: 5px;
    text-align: justify;

    & img {
        border-radius: 5px;
        border-top-left-radius: var(--border-radius-top);
        border-top-right-radius: var(--border-radius-top);
    }
`;

interface BackgroundBox_ContentProps extends React.HTMLAttributes<HTMLDivElement> {
    isAll: boolean;
}

const BackgroundBox_Content = styled('div')`
    position: relative;
    padding: 5px;
`;

const BackgroundBox_Content_All = styled(BackgroundBox_Content)`
    cursor: pointer;

    transition: opacity 0.3s ease-in-out;

    &:hover {
        opacity: 0.7;
    }
`;

const AddressContainer = styled('div')`
    position: relative;
    height: 18px;
`;

interface AddressContainer_ContentProps extends React.HTMLAttributes<HTMLDivElement> {
    addressColor: string;
    wasReceived: boolean;
}

const AddressContainer_Content = styled(Small, { shouldForwardProp: (prop: string) => !['wasReceived', 'addressColor'].includes(prop) })<AddressContainer_ContentProps>`
    /* --text-align: ${(props) => (props.wasReceived ? 'end' : 'start')}; */
    --text-align: ${(props) => (props.wasReceived ? 'start' : 'end')};
    --transform-origin: ${(props) => (props.wasReceived ? 'left' : 'right')};
    cursor: pointer;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    padding: 0 5px;
    text-align: var(--text-align);

    & div {
        display: inline-block;
        direction: rtl;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        background: ${(props) => props.addressColor};
        max-width: 80%;
        padding: 0 5px;
        transition: opacity 0.3s ease-in-out;

        &:hover {
            opacity: 0.7;
        }
    }
`;

interface TimeContainerProps {
    alignRight: boolean;
}

const TimeContainer = styled('div', { shouldForwardProp: (prop: string) => !['alignRight'].includes(prop) })<TimeContainerProps>`
    white-space: nowrap;
`;

const AmountContainer = styled(Small)``;

const Message: React.FC<IMessage> = ({ value: message }) => {
    const currentChat = useCurrentChat();

    const amountColor = useMemo(() => {
        if (
            currentChat == null ||
            message.amountSent === 1 ||
            (message.wasReceived && currentChat.receivedMinAmount === currentChat.receivedMaxAmount) ||
            (!message.wasReceived && currentChat.sentMinAmount === currentChat.sentMaxAmount)
        )
            return `rgb(${CHATMESSAGE_COLOR_LOW.r},${CHATMESSAGE_COLOR_LOW.g},${CHATMESSAGE_COLOR_LOW.b})`;
        if (message.wasReceived) {
            return interpolateColor(message.amountSent / currentChat.receivedMaxAmount);
        }
        return interpolateColor(message.amountSent / currentChat.sentMaxAmount);
    }, [message, currentChat]);

    const addressColor = useMemo(() => {
        return createGradient(stringToColor(message.otherParty));
    }, [message.otherParty]);

    let content: React.ReactNode = null;

    switch (message.type) {
        case 'image/jpeg':
        // falls through
        case 'image/png':
        // falls through
        case 'image/webp':
            content = <ImageMessage value={message} />;
            break;
        case 'audio/webm':
            content = <AudioMessage value={message} />;
            break;
        case 'text/plain':
            content = <TextMessage value={message} />;
            break;
    }

    const handleAddressClick = useCallback(() => {
        scrollToChatBottom(true, message.otherParty);
    }, [message]);

    const handleContentClick = useCallback(() => {
        scrollToChatBottom(true, message.otherParty, message.startTxid ?? `TEMP_${message.tempId}`);
    }, [message]);

    return (
        <Container wasReceived={message.wasReceived}>
            <TimeContainer className="blackTextShadow" alignRight={!message.wasReceived}>
                {message.time ? formatTime(message.time, !message.wasReceived) : 'Pending...'}
            </TimeContainer>
            <BackgroundBox amountColor={amountColor} isAll={currentChat?.otherParty == null}>
                {currentChat?.otherParty == null && (
                    <NoMaxWidthTooltip title={<div>{message.otherParty}</div>} enterDelay={500} followCursor>
                        <AddressContainer>
                            <AddressContainer_Content wasReceived={message.wasReceived} addressColor={addressColor} className="blackTextShadow" onClick={handleAddressClick} component="div">
                                <div>{message.otherPartyAlias && message.otherPartyAlias != '' ? message.otherPartyAlias : message.otherParty}</div>
                            </AddressContainer_Content>
                        </AddressContainer>
                    </NoMaxWidthTooltip>
                )}
                {currentChat?.otherParty == null ? (
                    <BackgroundBox_Content_All onClick={handleContentClick}>{content}</BackgroundBox_Content_All>
                ) : (
                    <BackgroundBox_Content>{content}</BackgroundBox_Content>
                )}
                {message.transactions.length > 0 && <ProgressIndicator value={message} />}
            </BackgroundBox>
            {message.amountSent > 1 && (
                <AmountContainer className="blackTextShadow">
                    <DeroAmount value={message.amountSent} />
                </AmountContainer>
            )}
        </Container>
    );
};

const formatTime = (dateString: string, alignRight: boolean) => {
    const date = dayjs(dateString);
    const time = date.format('HH:mm');
    const day = date.format('YYYY-MM-DD');
    return alignRight ? (
        <span>
            <Small component="span">{day}</Small> {time}
        </span>
    ) : (
        <span>
            {time} <Small component="span">{day}</Small>
        </span>
    );
};

export default Message;
