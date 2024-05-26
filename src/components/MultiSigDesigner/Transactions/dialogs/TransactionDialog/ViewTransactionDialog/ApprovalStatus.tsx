import React, { useEffect, useState, useMemo, useCallback } from 'react';

import IconButton from '@mui/material/IconButton';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import { styled } from '@mui/material/styles';

import ApproveIcon from '@mui/icons-material/ThumbUp';
import RejectIcon from '@mui/icons-material/ThumbDown';
import PendingIcon from '@mui/icons-material/HourglassTop';
import ChatIcon from '@mui/icons-material/Chat';
import { useContract } from 'hooks/multiSigHooks';
import { useWalletAddress } from 'hooks/deroHooks';
import { convertToFormatIndependentDeroAddress } from 'helpers/DeroHelper';
import { useDirectoryWallets } from 'hooks/directoryHooks';
import { getNameForDeroAddress } from 'helpers/DirectoryHelper';
import ChatButton from 'components/common/ChatButton';

interface IApprovalStatusProps {
    value: IApprovalStatus;
}

interface IApprovalStatusDetails {
    address: string;
    name: string;
    status: 'APPROVED' | 'REJECTED' | '';
}

const PendingCurrentAvatar = styled(Avatar)(({ theme }) => ({ backgroundColor: theme.palette.primary.main }));

export const ApprovedAvatar = styled(Avatar)(({ theme }) => ({ backgroundColor: theme.palette.success.main }));
export const RejectedAvatar = styled(Avatar)(({ theme }) => ({ backgroundColor: theme.palette.error.main }));

export const APPROVED = (
    <ApprovedAvatar>
        <ApproveIcon />
    </ApprovedAvatar>
);

export const REJECTED = (
    <RejectedAvatar>
        <RejectIcon />
    </RejectedAvatar>
);

const PENDING_CURRENT = (
    <PendingCurrentAvatar>
        <PendingIcon />
    </PendingCurrentAvatar>
);

const PENDING = (
    <Avatar>
        <PendingIcon />
    </Avatar>
);

const ApprovalStatus: React.FC<IApprovalStatusProps> = ({ value }) => {
    const [list, setList] = useState<IApprovalStatusDetails[]>([]);
    const { contract } = useContract();
    const walletAddress = useWalletAddress();

    const comparableWalletAddress = convertToFormatIndependentDeroAddress(walletAddress!);

    const getIconForStatus = (statusDetails: IApprovalStatusDetails, walletAddress: string | null) => {
        switch (statusDetails.status) {
            case 'APPROVED':
                return APPROVED;
            case 'REJECTED':
                return REJECTED;
        }
        return statusDetails.address == walletAddress ? PENDING_CURRENT : PENDING;
    };

    useEffect(() => {
        if (!contract?.involvedParties) {
            setList([]);
            return;
        }
        const list = contract.involvedParties.map((ip) => {
            let status: ApprovalType = '';
            if (ip.address && value[ip.address] != null) {
                status = value[ip.address];
            }
            return { address: ip.address!, name: getNameForDeroAddress(ip.address), status };
        });
        setList(list);
    }, [contract, value, comparableWalletAddress]);

    return (
        <List dense={true}>
            {list.map((listItem, index) => {
                return (
                    <ListItem key={index} secondaryAction={<ChatButton edge="end" openInNewWindow={true} walletAddress={listItem.address} />}>
                        <ListItemAvatar>{getIconForStatus(listItem, walletAddress)}</ListItemAvatar>
                        <ListItemText
                            primary={listItem.address}
                            secondary={listItem.name}
                            primaryTypographyProps={{
                                style: {
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                },
                            }}
                            secondaryTypographyProps={{
                                style: {
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                },
                            }}
                        />
                    </ListItem>
                );
            })}
        </List>
    );
};

export default ApprovalStatus;
