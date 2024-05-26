import React, { useState, useCallback, useMemo, useEffect } from 'react';
import WalletAddressSelector from 'components/common/WalletAddressSelector';
import { styled } from '@mui/material/styles';
import { isWalletDirectoryEntry, updateWallets } from 'helpers/DirectoryHelper';
import { addOrUpdateChatWithWalletDirectoryEntry, useCurrentChat, useCurrentChatOtherParty } from 'hooks/chatHooks';
import TextField from 'components/common/TextField';
import Button from '@mui/material/Button';
import { isDeroAddress, isSameAddress } from 'helpers/DeroHelper';
import { useWalletAddress } from 'hooks/deroHooks';

const Container = styled('div')`
    background-color: #302929c3;
    padding: 10px;
    display: flex;
    gap: 10px;
    margin: 8px;
    margin-bottom: 0;
    border-radius: 5px;
`;

const getFresh = () => ({ isSaved: false, flags: ['CHAT'] as WalletDirectoryEntryType[], address: '', alias: '' });

const ChatSelectorInfo: React.FC = () => {
    const [value, setValue] = useState<IWalletDirectoryEntry>(getFresh());
    const currentChat = useCurrentChat();
    const walletAddress = useWalletAddress();
    const otherParty = useCurrentChatOtherParty();
    const [walletDirectoryValue, setWalletDirectoryValue] = useState<IWalletDirectoryEntry | string | null>(null);

    useEffect(() => {
        if (currentChat?.otherParty && currentChat.otherParty.address !== value.address) {
            setValue({ ...currentChat.otherParty });
            setWalletDirectoryValue({ ...currentChat.otherParty });
        } else if (!currentChat?.otherParty) {
            setValue(getFresh());
            setWalletDirectoryValue(null);
        }
    }, [currentChat]);

    const updateChat = useCallback(
        (wde: IWalletDirectoryEntry) => {
            if (otherParty && otherParty.address === wde.address) {
                addOrUpdateChatWithWalletDirectoryEntry(wde);
                updateWallets();
            }
            setValue(wde);
        },
        [otherParty]
    );

    const handleAliasChange = useCallback(
        ({ target: { value: alias } }: React.ChangeEvent<HTMLInputElement>) => {
            let wde: IWalletDirectoryEntry;
            if (isWalletDirectoryEntry(walletDirectoryValue)) {
                wde = { ...walletDirectoryValue, alias };
            } else {
                wde = { alias, address: walletDirectoryValue ?? '', isSaved: false, flags: ['CHAT'] };
            }
            setWalletDirectoryValue(wde);
            updateChat(wde);
        },
        [walletDirectoryValue]
    );

    const handleAddressChange = useCallback(
        (newValue: IWalletDirectoryEntry | string | null, verified: boolean) => {
            if (verified) {
                setWalletDirectoryValue(newValue);
                if (isWalletDirectoryEntry(newValue)) {
                    setValue(newValue);
                    if (newValue) addOrUpdateChatWithWalletDirectoryEntry(newValue, true);
                } else {
                    setValue({ ...value, address: newValue ?? '' });
                }
            }
        },
        [value]
    );

    const handleOpenChatClick = useCallback(() => {
        if (value) addOrUpdateChatWithWalletDirectoryEntry(value, true);
    }, [value]);

    const isDisabledOpen = useMemo(() => {
        if (value === null) return true;
        return !isDeroAddress(value.address) || isSameAddress(value.address, walletAddress);
    }, [value, walletAddress]);

    // Expected Minimum

    return (
        <Container>
            <TextField label="Alias" value={value?.alias ?? ''} onChange={handleAliasChange} />
            <WalletAddressSelector value={walletDirectoryValue} onChange={handleAddressChange} />
            <Button onClick={handleOpenChatClick} disabled={isDisabledOpen}>
                Open Chat
            </Button>
        </Container>
    );
};

export default ChatSelectorInfo;
