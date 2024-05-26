import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogCloseButton } from 'components/Main/Dialogs';
import { TransitionForDialog } from 'components/common/Transitions';
import { TransitionProps } from '@mui/material/transitions';

import Form, { FormElement } from 'components/common/Form';
import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import { updateParty, useContract, usePartyWallet } from 'hooks/guaranteeHooks';
import Alias from 'components/MultiSigDesigner/dialogs/WalletDialog/Alias';
import { getWalletAddress } from 'helpers/DeroHelper';
import { isWalletDirectoryEntry } from 'helpers/DirectoryHelper';
import WalletAddressSelector from 'components/common/WalletAddressSelector';

export const GUARANTEE_PARTY_DIALOG_NAME = 'guaranteePartyDialog';

export const useGuaranteePartyDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
    party: 'A' | 'B' | null;
    setParty: (newParty: 'A' | 'B', isOpen?: boolean) => void;
} = () => {
    const guaranteePartyDialogState = useSelector((state: RootState) => state.mainState.dialogs[GUARANTEE_PARTY_DIALOG_NAME]);

    const isOpen = guaranteePartyDialogState != null && guaranteePartyDialogState.isOpen;
    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: GUARANTEE_PARTY_DIALOG_NAME, isOpen: newIsOpen }));
    };

    const party = (guaranteePartyDialogState?.value ?? null) as 'A' | 'B' | null;
    const setParty = (party: 'A' | 'B' | null, isOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialog({ name: GUARANTEE_PARTY_DIALOG_NAME, dialogState: { isOpen, value: party } }));
    };

    return { isOpen, setOpen, party, setParty };
};

const GuaranteePartyDialog: React.FC = () => {
    const { isLoaded } = useContract();
    const { isOpen, setOpen, party } = useGuaranteePartyDialog();
    const wallet = usePartyWallet(party ?? 'A');
    const id_scrollDialogTitle = useId();

    const [walletDirectoryValue, setWalletDirectoryValue] = useState<IWalletDirectoryEntry | string | null>(null);
    const walletDirectoryValueRef = useRef<IWalletDirectoryEntry | string | null>(null);

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
            if (!party) return;
            updateParty(party!, { ...wallet, alias });
        },
        [party, wallet]
    );

    const handleAddressChange = useCallback(
        (value: IWalletDirectoryEntry | string | null, verified: boolean) => {
            if (!party) return;
            if (verified) {
                setWalletDirectoryValue(value);
                if (isWalletDirectoryEntry(value)) {
                    if (!wallet.alias && value.alias) {
                        updateParty(party, { ...wallet, isHovered: false, alias: value.alias, address: value.address });
                    } else {
                        updateParty(party, { ...wallet, isHovered: false, address: value.address });
                    }
                } else {
                    updateParty(party, { ...wallet, isHovered: false, address: value });
                }
            }
        },
        [party, wallet]
    );

    if (!party) return <></>;

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
            <DialogTitle id={id_scrollDialogTitle}>Party Info</DialogTitle>
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
                <Button variant="contained" onClick={handleClose}>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GuaranteePartyDialog;
