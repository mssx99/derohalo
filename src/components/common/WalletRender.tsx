import { shortenScid } from 'helpers/DeroHelper';
import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import { useWalletDialog } from 'components/MultiSigDesigner/dialogs/WalletDialog';
import ChatButton from './ChatButton';
import Tooltip from '@mui/material/Tooltip';
import NoMaxWidthTooltip from './NoMaxWidthTooltip';

interface IWalletRender {
    value: IWallet;
    approverId?: string;
    renderChatButton?: boolean;
}

const Container = styled('div')`
    display: flex;
    flex-direction: row;
    cursor: pointer;
    & button:nth-of-type(1) {
        margin-left: 10;
    },
`;

const Alias = styled('div')`
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Account = styled('div')`
    font-size: 10px;
`;

const WalletRender: React.FC<IWalletRender> = ({ value, approverId = null, renderChatButton = true }) => {
    const { setWallet } = useWalletDialog();
    const alias = value.alias && value.alias.trim().length > 0 ? value.alias : '<no name>';
    const shortened = shortenScid(value.address);

    const openDialog = useCallback(() => {
        setWallet(value, approverId, true);
    }, [value, approverId]);

    return (
        <Container onClick={openDialog}>
            <Stack direction="column" sx={{ flexGrow: 1, alignItems: 'flex-start' }}>
                <Tooltip title={value.alias} placement="top">
                    <Alias>{alias}</Alias>
                </Tooltip>
                <NoMaxWidthTooltip title={value.address ? <div>{value.address}</div> : undefined} placement="bottom">
                    <Account>{shortened}</Account>
                </NoMaxWidthTooltip>
            </Stack>
            {renderChatButton && <ChatButton walletAddress={value.address} />}
        </Container>
    );
};

export default WalletRender;
