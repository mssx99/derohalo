import React from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';

import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { styled } from '@mui/material/styles';

interface IDisplayVerificationList {
    value: IVerificationResult;
}

const ErrorAvatar = styled(Avatar)(({ theme }) => ({ backgroundColor: theme.palette.error.main }));
const WarningAvatar = styled(Avatar)(({ theme }) => ({ backgroundColor: theme.palette.warning.main }));

const DisplayVerificationList: React.FC<IDisplayVerificationList> = ({ value }) => {
    return (
        <List>
            {value.errors.length > 0 &&
                value.errors.map((e, index) => (
                    <ListItem key={index}>
                        <ListItemAvatar>
                            <ErrorAvatar>
                                <ErrorIcon />
                            </ErrorAvatar>
                        </ListItemAvatar>
                        <ListItemText primary={e.message} secondary={e.details} />
                    </ListItem>
                ))}

            {value.warnings.length > 0 &&
                value.warnings.map((w, index) => (
                    <ListItem key={index}>
                        <ListItemAvatar>
                            <WarningAvatar>
                                <WarningIcon />
                            </WarningAvatar>
                        </ListItemAvatar>
                        <ListItemText primary={w.message} secondary={w.details} />
                    </ListItem>
                ))}
        </List>
    );
};

export default DisplayVerificationList;
