import React, { useEffect, useCallback } from 'react';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ChatIcon from '@mui/icons-material/Chat';
import { useWalletAddress } from 'hooks/deroHooks';
import { isSameAddress } from 'helpers/DeroHelper';
import { goToChat } from 'helpers/ChatHelper';
import { getExistingWalletDirectoryEntry } from 'helpers/DirectoryHelper';

interface IChatButton extends IconButtonProps {
    openInNewWindow?: boolean;
    walletAddress: string | null;
}

const ChatButton: React.FC<IChatButton> = ({ openInNewWindow = false, walletAddress, ...otherProps }) => {
    const myWalletAddress = useWalletAddress();
    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            if (walletAddress) {
                const foundWde = getExistingWalletDirectoryEntry(walletAddress);
                if (foundWde) {
                    goToChat(foundWde, openInNewWindow);
                } else {
                    goToChat(walletAddress, openInNewWindow);
                }
            }
            event.stopPropagation();
        },
        [walletAddress, openInNewWindow]
    );

    if (walletAddress == null || (myWalletAddress && isSameAddress(myWalletAddress, walletAddress))) {
        return <></>;
    }

    return (
        <IconButton aria-label="chat" size="small" onClick={handleClick} {...otherProps}>
            <ChatIcon fontSize="inherit" />
        </IconButton>
    );
};

export default ChatButton;
