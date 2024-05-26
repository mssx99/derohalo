import React, { useEffect, useRef, useCallback, useState, useId } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { TransitionForDialog } from 'components/common/Transitions';
import { TransitionProps } from '@mui/material/transitions';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';

import Form, { FormElement } from 'components/common/Form';
import TextField from 'components/common/TextField';
import WalletAddressSelector from 'components/common/WalletAddressSelector';
import Alias from './Alias';
import { DialogCloseButton } from 'components/Main/Dialogs';
import { deleteApprover, deleteInvolvedParty, updateWallet, useContract } from 'hooks/multiSigHooks';
import { getWalletAddress } from 'helpers/DeroHelper';
import { isWalletDirectoryEntry } from 'helpers/DirectoryHelper';

export const WALLET_DIALOG_NAME = 'walletDialog';

export const useWalletDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
    wallet: IWallet;
    setWallet: (newWallet: IWallet, approverId: string | null, isOpen: boolean) => void;
    approverId: string | null;
} = () => {
    const walletDialogState = useSelector((state: RootState) => state.mainState.dialogs[WALLET_DIALOG_NAME]);

    const isOpen = walletDialogState != null && walletDialogState.isOpen;
    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: WALLET_DIALOG_NAME, isOpen: newIsOpen }));
    };

    const wallet = walletDialogState?.value?.wallet as IWallet;
    const approverId = walletDialogState?.value?.approverId as string | null;
    const setWallet = (newWallet: IWallet, approverId: string | null, isOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialog({ name: WALLET_DIALOG_NAME, dialogState: { isOpen, value: { wallet: newWallet, approverId } } }));
    };

    return { isOpen, setOpen, wallet, setWallet, approverId };
};

const WalletDialog: React.FC = () => {
    const { isLoaded } = useContract();
    const { isOpen, setOpen, wallet, approverId } = useWalletDialog();

    const [walletDirectoryValue, setWalletDirectoryValue] = useState<IWalletDirectoryEntry | string | null>(null);
    const walletDirectoryValueRef = useRef<IWalletDirectoryEntry | string | null>(null);

    const id_scrollDialogTitle = useId();

    useEffect(() => {
        if (wallet?.address !== getWalletAddress(walletDirectoryValueRef.current)) {
            walletDirectoryValueRef.current = wallet?.address ?? null;
            setWalletDirectoryValue(wallet?.address ?? null);
        }
    }, [wallet?.address]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleAliasChange = useCallback(
        (alias: string) => {
            updateWallet({ ...wallet, isHovered: false, alias });
        },
        [wallet]
    );

    const handleAddressChange = useCallback(
        (value: IWalletDirectoryEntry | string | null, verified: boolean) => {
            if (verified) {
                setWalletDirectoryValue(value);
                if (isWalletDirectoryEntry(value)) {
                    if (!wallet.alias && value.alias) {
                        updateWallet({ ...wallet, isHovered: false, alias: value.alias, address: value.address });
                    } else {
                        updateWallet({ ...wallet, isHovered: false, address: value.address });
                    }
                } else {
                    updateWallet({ ...wallet, isHovered: false, address: value });
                }
            }
        },
        [wallet]
    );

    const removeApprover = useCallback(() => {
        approverId && deleteApprover(approverId);
        setOpen(false);
    }, [approverId]);

    const removeParty = useCallback(() => {
        wallet && deleteInvolvedParty(wallet.id);
        setOpen(false);
    }, [wallet?.id]);

    if (!wallet) return <></>;

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
            <DialogTitle id={id_scrollDialogTitle}>Wallet Info</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Form>
                    <FormElement>
                        <Alias value={wallet.alias} onChange={handleAliasChange} readOnly={isLoaded} />
                    </FormElement>
                    <FormElement>
                        <WalletAddressSelector value={walletDirectoryValue} onChange={handleAddressChange} readOnly={isLoaded} />
                    </FormElement>
                </Form>
            </DialogContent>
            <DialogActions>
                {!isLoaded ? approverId ? <Button onClick={removeApprover}>Remove this approver</Button> : <Button onClick={removeParty}>Remove Party</Button> : undefined}
                <Button variant="contained" onClick={handleClose}>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WalletDialog;
