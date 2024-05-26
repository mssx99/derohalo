import React, { useCallback, useMemo } from 'react';
import { styled } from '@mui/material/styles';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText, { ListItemTextProps } from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DeroAmount from 'components/common/DeroAmount';
import { convertBlocksToFormattedTime } from 'helpers/FormatHelper';
import { useCurrentTime } from 'hooks/mainHooks';
import { useCurrentBlockheightOrEstimate } from 'hooks/deroHooks';

interface IConditionContainer {
    authorizationGroup: IAuthorizationGroup;
    onOpen: () => void;
}

const Container = styled('div')`
    color: black;
    text-align: center;
    cursor: pointer;
`;

const ConditionContainer: React.FC<IConditionContainer> = ({ authorizationGroup, onOpen }) => {
    return (
        <Container onClick={onOpen}>
            <List dense>
                <ListItem>
                    <ListItemAvatar>
                        <Avatar>
                            <AttachMoneyIcon />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Withdrawal Limit" secondary={authorizationGroup.maximumWithdrawal ? <DeroAmount onlyText value={authorizationGroup.maximumWithdrawal} /> : 'no limit'} />
                </ListItem>
                <ListItem>
                    <ListItemAvatar>
                        <Avatar>
                            <PeopleAltIcon />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary="Required Approvers"
                        secondary={
                            !authorizationGroup.requiredApprovers || authorizationGroup.requiredApprovers < 2
                                ? 'single signature'
                                : `${authorizationGroup.requiredApprovers} out of ${authorizationGroup.approvers.length}`
                        }
                    />
                </ListItem>
                <ListItem>
                    <ListItemAvatar>
                        <Avatar>
                            <HourglassEmptyIcon />
                        </Avatar>
                    </ListItemAvatar>
                    {authorizationGroup.withdrawalStartIn && authorizationGroup.withdrawalStartIn > 0 ? (
                        <WithdrawalListItemText_Time authorizationGroup={authorizationGroup} />
                    ) : (
                        <WithdrawalListItemText_Block authorizationGroup={authorizationGroup} />
                    )}
                </ListItem>
            </List>
        </Container>
    );
};

interface IWithdrawalListItem {
    authorizationGroup: IAuthorizationGroup;
}

const WithdrawalListItemText_Time: React.FC<IWithdrawalListItem> = ({ authorizationGroup }) => {
    const currentTime = useCurrentTime(authorizationGroup.withdrawalStartIn !== undefined && authorizationGroup.withdrawalStartIn !== 0);

    const withdrawalStartDate = useMemo(() => {
        const canBeChangedText = authorizationGroup.furtherDelay && authorizationGroup.furtherDelay.length > 0 ? ' (delayable)' : '';

        return (authorizationGroup.withdrawalStartIn ? convertBlocksToFormattedTime(authorizationGroup.withdrawalStartIn) : 'immediately') + canBeChangedText;
    }, [authorizationGroup.furtherDelay, authorizationGroup.withdrawalStartIn, currentTime]);

    return <ListItemText primary="Withdrawal Start" secondary={withdrawalStartDate} />;
};

const WithdrawalListItemText_Block: React.FC<IWithdrawalListItem> = ({ authorizationGroup }) => {
    const { blockheight, estimate } = useCurrentBlockheightOrEstimate();

    const withdrawalStartDate = useMemo(() => {
        const canBeChangedText = authorizationGroup.furtherDelay && authorizationGroup.furtherDelay.length > 0 ? ' (delayable)' : '';

        if (!authorizationGroup.withdrawalBlockheight || authorizationGroup.withdrawalBlockheight <= blockheight) {
            return 'immediately' + canBeChangedText;
        }

        return convertBlocksToFormattedTime(authorizationGroup.withdrawalBlockheight - blockheight) + canBeChangedText;
    }, [authorizationGroup.furtherDelay, authorizationGroup.withdrawalBlockheight, blockheight, estimate]);

    return <ListItemText primary="Withdrawal Start" secondary={withdrawalStartDate} />;
};

export default ConditionContainer;
