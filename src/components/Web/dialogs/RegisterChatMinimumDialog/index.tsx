import React, { useId, useCallback, useState, useMemo, useEffect } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogCloseButton } from 'components/Main/Dialogs';
import { TransitionForDialog } from 'components/common/Transitions';
import { TransitionProps } from '@mui/material/transitions';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import DeroAmount from 'components/common/DeroAmount';
import { registerChatMinimum, useContract, usePublicDirectoryEntryForChat } from 'hooks/webHooks';
import { useCurrentChat, useCurrentChatMinimum } from 'hooks/chatHooks';
import Form, { FormElement } from 'components/common/Form';
import { styled } from '@mui/material/styles';

import TextField from 'components/common/TextField';
import { Body } from 'components/common/TextElements';
import { calculateChatMinimumFees, loadContractAndSet } from 'helpers/Web/WebContractHelper';
import { updateWalletBalance, useIsConnected } from 'hooks/deroHooks';
import { addSnackbar } from 'components/screen/Snackbars';
import { CHAT_MINIMUM_CHARLIMIT_ALIAS, CHAT_MINIMUM_CHARLIMIT_DESCRIPTION, MESSAGE_SEVERITY } from 'Constants';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { convertToFormatIndependentDeroAddress } from 'helpers/DeroHelper';
import MaxLengthTextField from 'components/common/MaxLengthTextField';

const REGISTER_CHAT_MINIMUM_DIALOG_NAME = 'RegisterChatMinimumDialog';

export const useRegisterChatMinimumDialog = () => {
    const dialogState = useSelector((state: RootState) => state.mainState.dialogs[REGISTER_CHAT_MINIMUM_DIALOG_NAME]);

    const isOpen = dialogState != null && dialogState.isOpen;
    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: REGISTER_CHAT_MINIMUM_DIALOG_NAME, isOpen: newIsOpen }));
    };

    return { isOpen, setOpen };
};

const StyledForm = styled(Form)`
    margin-top: 20px;
    margin-bottom: 20px;
`;

export const RegisterChatMinimumDialog: React.FC = () => {
    const { isOpen, setOpen } = useRegisterChatMinimumDialog();
    const isConnected = useIsConnected();

    const webContract = useContract();
    const chat = useCurrentChat();
    const currentChatMinimum = useCurrentChatMinimum();
    const { here } = usePublicDirectoryEntryForChat(chat);

    const [alias, setAlias] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    const id_scrollDialogTitle = useId();

    useEffect(() => {
        const chatFormatIndependentAddress = convertToFormatIndependentDeroAddress(chat?.otherParty?.address ?? null);

        if (here && chatFormatIndependentAddress == here.otherParty) {
            setAlias(here.alias ?? '');
            setDescription(here.description ?? '');
        } else if (here && !chatFormatIndependentAddress) {
            // Could be or as well, for better readability. This is for if the here is global.
            setAlias(here.alias ?? '');
            setDescription(here.description ?? '');
        } else {
            setAlias('');
            setDescription('');
        }
    }, [here, chat]);

    const fees = useMemo(() => {
        if (webContract) return calculateChatMinimumFees(webContract, currentChatMinimum);
        return 0;
    }, [webContract, currentChatMinimum]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleAliasChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
        setAlias(value);
    };

    const handleDescriptionChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(value);
    };

    const handleRegister = useCallback(async () => {
        if (!webContract?.scid || !chat) return;
        setBusyBackdrop(true, 'Registering the new ChatMinimum.');
        try {
            await registerChatMinimum(webContract.scid, fees, chat.otherParty?.address ?? null, alias, description, currentChatMinimum);
            await loadContractAndSet(webContract.scid, false);
            addSnackbar({ message: 'The ChatMinimum has been updated successfully.', severity: MESSAGE_SEVERITY.SUCCESS });
            updateWalletBalance();
            handleClose();
        } catch (e) {
            console.error(e);
            addSnackbar({ message: 'An error ocurred.', severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [webContract, fees, chat, alias, description, currentChatMinimum, handleClose]);

    return (
        <Dialog
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '45rem',
                        maxWidth: '100%',
                    },
                },
            }}
            open={isOpen}
            onClose={handleClose}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            aria-labelledby={id_scrollDialogTitle}
        >
            <DialogTitle id={id_scrollDialogTitle}>Register Chat-Minimum</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Body>
                    Register the amount <DeroAmount value={currentChatMinimum} /> for{' '}
                    {!chat?.otherParty ? 'ALL CHATS without specific minimum.' : `the chat with dero-address ${chat.otherParty.address}.`}
                </Body>
                <StyledForm>
                    <FormElement label="Alias">
                        <MaxLengthTextField label="Alias" value={alias} onChange={handleAliasChange} fullWidth charLimit={CHAT_MINIMUM_CHARLIMIT_ALIAS} />
                    </FormElement>
                    <FormElement label="Description">
                        <MaxLengthTextField label="Description" value={description} onChange={handleDescriptionChange} fullWidth multiline charLimit={CHAT_MINIMUM_CHARLIMIT_DESCRIPTION} />
                    </FormElement>
                </StyledForm>
                <Body sx={{ color: 'red' }}>
                    The website will charge <DeroAmount value={fees} />
                </Body>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleRegister} disabled={!webContract || !isConnected || !chat}>
                    Register
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegisterChatMinimumDialog;
