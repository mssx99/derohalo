import React, { useCallback, useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Body } from 'components/common/TextElements';
import DeroAmount from 'components/common/DeroAmount';
import { usePublicDirectoryEntryForChat } from 'hooks/webHooks';
import { useCurrentChat, useCurrentChatMinimum } from 'hooks/chatHooks';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import Paper, { PaperProps } from '@mui/material/Paper';
import { useRegisterChatMinimumDialog } from 'components/Web/dialogs/RegisterChatMinimumDialog';
import Tooltip from '@mui/material/Tooltip';

interface IChatListDetails {
    chat: IChat;
}

const Container = styled('div')`
    display: flex;
    flex-direction: column;
`;

const Line = styled('div')`
    display: flex;
    margin-bottom: 2px;
    align-items: center;
`;

const Description = styled(Body)`
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 30px;
`;

const PaperWithElevation = (props: PaperProps) => <Paper {...props} elevation={10} />;

const MinLine = styled(PaperWithElevation)`
    display: flex;
    margin-bottom: 2px;
    align-items: center;
`;

const MinimumDescription = styled('div')`
    flex-shrink: 1;
    min-width: 30px;
    display: flex;
    flex-direction: row;
    align-items: center;

    & div div {
        flex-shrink: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 30px;
    }

    & div div:nth-of-type(1) {
        font-size: 10px;
    }
`;

const Value = styled(Body)`
    flex-grow: 1;
    text-align: right;
`;

const CustomEditIcon = styled(EditIcon)`
    font-size: 24px;
    align-self: center;
    transition: transform 0.5s ease;
    cursor: pointer;

    &:hover {
        transform: scale(1.5);
    }
`;

const CustomWarningIcon = styled(WarningIcon)`
    color: yellow;
    font-size: 24px;
    align-self: center;
    transition: transform 0.5s ease;
    cursor: pointer;

    &:hover {
        transform: scale(1.5);
    }
`;

const ChatListDetails: React.FC<IChatListDetails> = ({ chat }) => {
    const { setOpen } = useRegisterChatMinimumDialog();
    const { here, there } = usePublicDirectoryEntryForChat(chat);
    const currentChat = useCurrentChat();
    const currentChatMinimum = useCurrentChatMinimum();

    const [appliedMin, setAppliedMin] = useState<Uint64>(here.minimum);

    useEffect(() => {
        if (chat.otherParty?.address === currentChat?.otherParty?.address) {
            setAppliedMin(currentChatMinimum);
        }
    }, [chat, currentChat, currentChatMinimum, here]);

    const handleRegisterChatMinimum = useCallback(() => {
        setOpen(true);
    }, [chat, currentChatMinimum]);

    return (
        <Container>
            <Line>
                <Description># of messages</Description>
                <Value>{chat.messages.length}</Value>
            </Line>
            <Line>
                <Description>Paid</Description>
                <Value>
                    <DeroAmount value={chat.totalSent} preferUsd />
                </Value>
            </Line>
            <Line>
                <Description>Received</Description>
                <Value>
                    <DeroAmount value={chat.totalReceived} preferUsd />
                </Value>
            </Line>
            <Line>
                <MinimumDescription>
                    <Tooltip title={<TooltipContainer value={there} isHere={false} />} placement="right" followCursor>
                        <div>
                            <div>Minimum Display</div>
                            <div>There</div>
                        </div>
                    </Tooltip>
                </MinimumDescription>
                <Value>
                    <DeroAmount value={there.minimum} preferUsd />
                </Value>
            </Line>
            <MinLine sx={{ marginTop: '8px' }}>
                <MinimumDescription>
                    <Tooltip title={<TooltipContainer value={here} isHere={true} />} placement="right" followCursor>
                        <div>
                            <div>Minimum Display</div>
                            <div>Here</div>
                        </div>
                    </Tooltip>
                    {here.minimum !== appliedMin ? <CustomWarningIcon onClick={handleRegisterChatMinimum} /> : <CustomEditIcon onClick={handleRegisterChatMinimum} />}
                </MinimumDescription>
                <Value>
                    <DeroAmount value={here.minimum} preferUsd />
                </Value>
            </MinLine>
        </Container>
    );
};

interface ITooltipContainer {
    value: IChatDirectoryEntry;
    isHere: boolean;
}

const TooltipExplaination = styled('div')`
    font-size: 1rem;
    text-align: center;
    margin-bottom: 0.5rem;
`;

const TooldivContainer = styled('div')`
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const TooltipContainer: React.FC<ITooltipContainer> = ({ value, isHere }) => {
    let content: React.ReactNode;
    if (isHere) {
        content = <TooltipExplaination>This is the info which the other Party sees about you. Keep your Chat-Minimum in sync if you change it.</TooltipExplaination>;
    } else {
        content = (
            <TooltipExplaination>This is the info which the other Party supposedly has configured. It might be that the ChatMinimum got changed locally and it was not registered.</TooltipExplaination>
        );
    }
    return (
        <TooldivContainer>
            {content}
            <div>Alias: {value.alias}</div>
            <div>Description: {value.description}</div>
        </TooldivContainer>
    );
};

export default ChatListDetails;
