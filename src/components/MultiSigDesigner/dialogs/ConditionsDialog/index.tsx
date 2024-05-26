import React, { useEffect, useRef, useCallback, useId, useMemo } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';

import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import { TransitionForDialog } from 'components/common/Transitions';
import RequiredApprovers from './RequiredApprovers';
import Form, { FormElement } from 'components/common/Form';
import WithdrawStart from './WithdrawStart';
import { DialogCloseButton } from 'components/Main/Dialogs';
import MaximumWithdrawal from './MaximumWithdrawal';
import Description from './Description';
import { updateAuthGroup, useContract } from 'hooks/multiSigHooks';
import FurtherDelay from './FurtherDelay';
import NoMaxWidthTooltip from 'components/common/NoMaxWidthTooltip';
import { useCurrentBlockheightOrEstimate } from 'hooks/deroHooks';
import { convertBlocksToFormattedTime } from 'helpers/FormatHelper';
import { styled } from '@mui/material/styles';

export const CONDITION_DIALOG_NAME = 'conditionDialog';

export const useConditionDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
    authorizationGroup: IAuthorizationGroup;
    setAuthorizationGroup: (newAuthorizationGroup: IAuthorizationGroup) => void;
} = () => {
    const conditionDialogState = useSelector((state: RootState) => state.mainState.dialogs[CONDITION_DIALOG_NAME]);

    const isOpen = conditionDialogState != null && conditionDialogState.isOpen;
    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: CONDITION_DIALOG_NAME, isOpen: newIsOpen }));
    };

    const authorizationGroup = useSelector((state: RootState) => state.mainState.dialogs[CONDITION_DIALOG_NAME]?.value);
    const setAuthorizationGroup = (newAuthorizationGroup: IAuthorizationGroup, isOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialog({ name: CONDITION_DIALOG_NAME, dialogState: { isOpen, value: newAuthorizationGroup } }));
    };

    return { isOpen, setOpen, authorizationGroup, setAuthorizationGroup };
};

const ConditionsDialog: React.FC = () => {
    const { isOpen, setOpen, authorizationGroup } = useConditionDialog();
    const { isLoaded } = useContract();

    const id_scrollDialogTitle = useId();

    const handleClose = () => {
        setOpen(false);
    };

    const handleDescriptionChange = useCallback(
        (description: string) => {
            updateAuthGroup({ ...authorizationGroup, description });
        },
        [authorizationGroup]
    );

    const handleMaximumWithdrawalChange = useCallback(
        (maximumWithdrawal: Uint64) => {
            updateAuthGroup({ ...authorizationGroup, maximumWithdrawal });
        },
        [authorizationGroup]
    );

    const handleRequiredApproversChange = useCallback(
        (requiredApprovers: Uint64) => {
            updateAuthGroup({ ...authorizationGroup, requiredApprovers });
        },
        [authorizationGroup]
    );

    const handleWithdrawStartChange = useCallback(
        (withdrawalStartIn: Uint64) => {
            updateAuthGroup({ ...authorizationGroup, withdrawalStartIn });
        },
        [authorizationGroup]
    );

    if (!authorizationGroup) return <></>;

    return (
        <Dialog open={isOpen} onClose={handleClose} scroll="paper" TransitionComponent={TransitionForDialog} aria-labelledby={id_scrollDialogTitle}>
            <DialogTitle id={id_scrollDialogTitle}>Condition configurator</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Form>
                    <FormElement>
                        <Description value={authorizationGroup.description} onChange={handleDescriptionChange} readOnly={isLoaded} />
                    </FormElement>
                    <FormElement>
                        <MaximumWithdrawal value={authorizationGroup.maximumWithdrawal} onChange={handleMaximumWithdrawalChange} readOnly={isLoaded} />
                    </FormElement>
                    {authorizationGroup.approvers.length > 1 && (
                        <FormElement label="Required Approvers">
                            <RequiredApprovers
                                value={authorizationGroup.requiredApprovers}
                                totalApprovers={authorizationGroup.approvers.length}
                                onChange={handleRequiredApproversChange}
                                disabled={isLoaded}
                            />
                        </FormElement>
                    )}
                    <FormElement>
                        {!isLoaded ? (
                            <WithdrawStart value={authorizationGroup.withdrawalStartIn} onChange={handleWithdrawStartChange} />
                        ) : authorizationGroup.withdrawalBlockheight ? (
                            <DisplayInfo authorizationGroup={authorizationGroup} />
                        ) : null}
                    </FormElement>
                    <FormElement>
                        <FurtherDelay />
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

interface IDisplayInfo {
    authorizationGroup: IAuthorizationGroup;
}

const DisplayContainer = styled('div')``;

const DisplayInfo: React.FC<IDisplayInfo> = ({ authorizationGroup }) => {
    const { blockheight, estimate } = useCurrentBlockheightOrEstimate();

    const withdrawalText = useMemo(() => {
        let canBeChangedText: React.ReactNode = '';

        if (authorizationGroup.furtherDelay && authorizationGroup.furtherDelay.length) {
            canBeChangedText = authorizationGroup.furtherDelay.map((f, index, array) => {
                const name = f.alias ?? `User${index}`;
                const isLastItem = index === array.length - 1;

                return (
                    <React.Fragment key={index}>
                        <NoMaxWidthTooltip title={f.address} followCursor>
                            <span>{name}</span>
                        </NoMaxWidthTooltip>
                        {!isLastItem && ', '}
                    </React.Fragment>
                );
            });

            canBeChangedText = authorizationGroup.furtherDelay && authorizationGroup.furtherDelay.length > 0 ? <> This can be changed by the following involved parties: {canBeChangedText}.</> : '';
        }

        if (!authorizationGroup.withdrawalBlockheight || authorizationGroup.withdrawalBlockheight <= blockheight) {
            return <DisplayContainer>You can withdraw immediately. {canBeChangedText}</DisplayContainer>;
        }

        return (
            <DisplayContainer>
                You can withdraw starting: {convertBlocksToFormattedTime(authorizationGroup.withdrawalBlockheight - blockheight)}. {canBeChangedText}
            </DisplayContainer>
        );
    }, [authorizationGroup.furtherDelay, authorizationGroup.withdrawalBlockheight, blockheight, estimate]);

    return <DisplayContainer>{withdrawalText}</DisplayContainer>;
};

export default ConditionsDialog;
