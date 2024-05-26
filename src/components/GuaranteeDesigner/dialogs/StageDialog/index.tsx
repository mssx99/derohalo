import React, { useMemo, useCallback, useId } from 'react';
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
import { updateStage, useContract } from 'hooks/guaranteeHooks';
import DeroAmountField from 'components/common/DeroAmountField';
import TextField from 'components/common/TextField';
import Dependency from './Dependency';

export const STAGE_DIALOG_NAME = 'stageDialog';

export const useStageDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
    stage: IStage | null;
    setStage: (newStage: IStage, isOpen?: boolean) => void;
} = () => {
    const stageDialogState = useSelector((state: RootState) => state.mainState.dialogs[STAGE_DIALOG_NAME]);

    const isOpen = stageDialogState != null && stageDialogState.isOpen;
    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: STAGE_DIALOG_NAME, isOpen: newIsOpen }));
    };

    const stage = (stageDialogState?.value ?? null) as IStage | null;
    const setStage = (newStage: IStage | null, isOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialog({ name: STAGE_DIALOG_NAME, dialogState: { isOpen, value: newStage } }));
    };

    return { isOpen, setOpen, stage, setStage };
};

const StageDialog: React.FC = () => {
    const { isLoaded, contract } = useContract();
    const { isOpen, setOpen, stage } = useStageDialog();

    const id_scrollDialogTitle = useId();

    const a_alias = useMemo(() => (contract.firstPartyWallet?.alias ? `A (${contract.firstPartyWallet?.alias})` : 'A'), [contract]);
    const b_alias = useMemo(() => (contract.secondPartyWallet?.alias ? `B (${contract.secondPartyWallet?.alias})` : 'B'), [contract]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleOnChangeAGuarantee = useCallback(
        (a_Guarantee: Uint64) => {
            if (!stage) return;
            updateStage({ ...stage, a_Guarantee });
        },
        [stage]
    );

    const handleOnChangeATransfer = useCallback(
        (a_Transfer: Uint64) => {
            if (!stage) return;
            updateStage({ ...stage, a_Transfer });
        },
        [stage]
    );

    const handleOnChangeBGuarantee = useCallback(
        (b_Guarantee: Uint64) => {
            if (!stage) return;
            updateStage({ ...stage, b_Guarantee });
        },
        [stage]
    );

    const handleOnChangeBTransfer = useCallback(
        (b_Transfer: Uint64) => {
            if (!stage) return;
            updateStage({ ...stage, b_Transfer });
        },
        [stage]
    );

    const handleDescriptionChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (!stage) return;
            updateStage({ ...stage, description: event.target.value });
        },
        [stage]
    );

    if (!stage) return <></>;

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
            <DialogTitle id={id_scrollDialogTitle}>Stage {stage.id} Info</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Form>
                    <FormElement label={`Party ${a_alias}`}>
                        <DeroAmountField label="Guarantee" fullWidth value={stage.a_Guarantee} onValueChange={handleOnChangeAGuarantee} readOnly={isLoaded} />
                        <DeroAmountField label={`Transfer to ${b_alias}`} fullWidth value={stage.a_Transfer} onValueChange={handleOnChangeATransfer} readOnly={isLoaded} />
                    </FormElement>
                    <FormElement label={`Party ${b_alias}`}>
                        <DeroAmountField label="Guarantee" fullWidth value={stage.b_Guarantee} onValueChange={handleOnChangeBGuarantee} readOnly={isLoaded} />
                        <DeroAmountField label={`Transfer to ${a_alias}`} fullWidth value={stage.b_Transfer} onValueChange={handleOnChangeBTransfer} readOnly={isLoaded} />
                    </FormElement>
                    <FormElement label="Agreement Time-Limit">
                        <Dependency stage={stage} />
                    </FormElement>
                    <FormElement>
                        <TextField label="Description" multiline fullWidth value={stage.description ?? ''} onChange={handleDescriptionChange} readOnly={isLoaded} />
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
export default StageDialog;
