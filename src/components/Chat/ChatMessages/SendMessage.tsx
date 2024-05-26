import React, { ClipboardEvent, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import TextField from 'components/common/TextField';
import { styled } from '@mui/material/styles';
import { useImagePastedDialog } from '../dialogs/ImagePastedDialog';
import Button from '@mui/material/Button';
import { useCurrentChat, useCurrentChatOtherParty } from 'hooks/chatHooks';
import { addNewTextToChat, getEstimatedTransferCost, getEstimatedTransfers, sendMessage } from 'helpers/ChatHelper';
import DeroAmountField from 'components/common/DeroAmountField';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import { NumberFormatValues } from 'react-number-format';
import DeroAmount from 'components/common/DeroAmount';
import { useIsConnected, useWalletBalance } from 'hooks/deroHooks';
import { Small } from 'components/common/TextElements';

import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAudioConfiguratorDialog } from '../dialogs/AudioConfiguratorDialog';
import ToggleIconButton from 'components/common/ToggleIconButton';
import ChatSettings from '../ChatSettings';

import Grow from '@mui/material/Grow';
import Collapse from '@mui/material/Collapse';
import { usePublicDirectoryEntryForChat } from 'hooks/webHooks';

const Container = styled('div')`
    background-color: #302929c3;
    padding: 10px;
    margin: 8px;
    margin-top: 0;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
`;

const FirstLineContainer = styled('div')`
    display: flex;
    gap: 10px;
`;

const OtherOptionsContainer = styled('div')`
    justify-content: space-between;
    display: flex;
    flex-direction: column;
`;

const SendMessage: React.FC = () => {
    const isConnected = useIsConnected();
    const walletBalance = useWalletBalance();
    const [amount, setAmount] = useState(1);
    const amountRef = useRef(1);

    const [text, setText] = useState('');
    const [estimatedTransfers, setEstimatedTransfers] = useState<number>(0);
    const { setOpen } = useAudioConfiguratorDialog();

    const otherParty = useCurrentChatOtherParty();
    const chat = useCurrentChat();
    const { there } = usePublicDirectoryEntryForChat(chat);

    const { setImageFile } = useImagePastedDialog();

    const [settingsShowing, setSettingsShowing] = useState(false);

    useEffect(() => {
        amountRef.current = amount;
    }, [amount]);

    useEffect(() => {
        if (amountRef.current < there.minimum) {
            setAmount(there.minimum);
        }
    }, [there]);

    const handleTextChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const text = event.target.value;
            setText(text);
            const estimatedTransfers = getEstimatedTransfers(text.length);
            setEstimatedTransfers(estimatedTransfers);
            if (amount < estimatedTransfers) {
                setAmount(estimatedTransfers);
            }
        },
        [amount]
    );

    const minTransferLabel = useMemo(
        () => (
            <span>
                Total amount (min: <DeroAmount value={estimatedTransfers} />)
            </span>
        ),
        [estimatedTransfers]
    );

    const handleAmountChange = (newAmount: Uint64) => {
        setAmount(newAmount);
    };

    const isAllowedAmount = useCallback(
        (nfv: NumberFormatValues) => {
            const value = Math.round(parseFloat(nfv.value) * 100000);

            return value >= estimatedTransfers;
        },
        [estimatedTransfers]
    );

    const totalCost = useMemo(() => {
        return getEstimatedTransferCost(estimatedTransfers) + amount;
    }, [estimatedTransfers, amount]);

    const sendText = useMemo(
        () => (
            <span>
                Send
                <Small>
                    (Cost&nbsp;
                    <DeroAmount value={totalCost} />)
                </Small>
            </span>
        ),
        [totalCost]
    );

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        const items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image')) {
                const file = item.getAsFile();
                if (file) {
                    setImageFile(file);
                }
            }
        }
    };

    const handleSend = useCallback(() => {
        if (!text || !otherParty || !isConnected || estimatedTransfers > 256 || walletBalance < totalCost) return;
        try {
            sendMessage(otherParty.address, text, amount, 'text/plain');
            setText('');
        } catch (e) {
            console.error(e);
            if (e instanceof Error) {
                addSnackbar({ message: e.message, severity: MESSAGE_SEVERITY.ERROR });
            } else {
                console.error(e);
            }
        }
    }, [otherParty, text, totalCost, walletBalance]);

    const handleMicClick = useCallback(() => {
        setOpen(true);
    }, []);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.keyCode === 13 && !event.shiftKey) {
                handleSend();
                event.preventDefault();
            }
        },
        [handleSend]
    );

    const handleToggleSettings = (newSettingsShowing: boolean) => {
        setSettingsShowing(newSettingsShowing);
    };

    if (!otherParty)
        return (
            <Container>
                <ChatSettings />
            </Container>
        );

    return (
        <Container>
            <Collapse in={settingsShowing} orientation="vertical">
                <ChatSettings />
            </Collapse>
            <FirstLineContainer>
                <DeroAmountField label={minTransferLabel} value={amount} onValueChange={handleAmountChange} isAllowed={isAllowedAmount} />
                <TextField
                    type="text"
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    label="Type your text or paste an image here"
                    fullWidth
                    multiline
                    maxRows={4}
                    value={text}
                    onChange={handleTextChange}
                />
                <Button variant="contained" onClick={handleSend} disabled={text === '' || estimatedTransfers > 256 || !isConnected || walletBalance < totalCost}>
                    {sendText}
                </Button>
                <OtherOptionsContainer>
                    <ToggleIconButton aria-label="Settings" size="small" isToggled={settingsShowing} onToggleChange={handleToggleSettings}>
                        <SettingsIcon />
                    </ToggleIconButton>
                    <IconButton aria-label="Send Audio" size="small" onClick={handleMicClick}>
                        <MicIcon />
                    </IconButton>
                </OtherOptionsContainer>
            </FirstLineContainer>
        </Container>
    );
};

export default SendMessage;
