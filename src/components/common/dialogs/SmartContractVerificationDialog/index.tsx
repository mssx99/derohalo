import Reac, { useCallback } from 'react';

import Dialog from '@mui/material/Dialog';
import { TransitionForDialog } from 'components/common/Transitions';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogCloseButton } from 'components/Main/Dialogs';

import Button from '@mui/material/Button';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import { installMultiSigContract } from 'helpers/MultiSig/MultiSigSmartContractHelper';
import { useContract } from 'hooks/multiSigHooks';
import DisplayVerificationList from './DisplayVerificationList';
import { installGuaranteeContract } from 'helpers/Guarantee/GuaranteeSmartContractHelper';

export const SMARTCONTRACTVERIFICATION_DIALOG_NAME = 'SmartContractVerificationDialog';

interface ISmartContractVerificationDialogInfos {
    observations: IVerificationResult;
    contract: IContract;
    title?: string;
}

export const useSmartContractVerificationDialog = () => {
    const dialogState = useSelector((state: RootState) => state.mainState.dialogs[SMARTCONTRACTVERIFICATION_DIALOG_NAME]);

    const isOpen = dialogState != null && dialogState.isOpen;

    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: SMARTCONTRACTVERIFICATION_DIALOG_NAME, isOpen: newIsOpen }));
    };

    const infos = dialogState?.value as ISmartContractVerificationDialogInfos;
    const setInfos = (value: ISmartContractVerificationDialogInfos, isOpen: boolean = true) => {
        if (value && !value.title) value.title = 'SmartContract Verification';
        store.dispatch(mainStateActions.setDialog({ name: SMARTCONTRACTVERIFICATION_DIALOG_NAME, dialogState: { isOpen, value } }));
    };

    return { isOpen, infos, setOpen, setInfos };
};

const SmartContractVerificationDialog: React.FC = () => {
    const { isOpen, setOpen, infos } = useSmartContractVerificationDialog();

    const handleClose = () => {
        setOpen(false);
    };

    const handleInstallAnyway = useCallback(() => {
        if (!infos?.contract) return;
        handleClose();
        if (infos?.contract?.contractType === 'MULTISIGNATURE') {
            installMultiSigContract(infos.contract as IMultiSigContract);
        }
        if (infos?.contract?.contractType === 'GUARANTEE') {
            installGuaranteeContract(infos.contract as IGuaranteeContract);
        }
    }, [infos?.contract]);

    if (!infos) return <></>;

    return (
        <Dialog
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '65rem',
                        maxWidth: '100%',
                    },
                },
            }}
            open={isOpen}
            onClose={handleClose}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            aria-labelledby="sigcheck-dialog-title"
        >
            <DialogTitle id="sigcheck-dialog-title">{infos.title}</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <DisplayVerificationList value={infos.observations} />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleInstallAnyway} disabled={infos?.observations?.valid ? false : true}>
                    Install anyway
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SmartContractVerificationDialog;
