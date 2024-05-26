import React, { useState, useCallback, useMemo } from 'react';

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

import { StringDiff, DiffMethod } from 'react-string-diff';
import { Code } from 'components/common/CodeDisplay';
import { styled, css } from '@mui/material/styles';
import MethodSelect from './MethodSelect';
import { setVerifiedGuaranteeContractAndBalances } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { setVerifiedMultiSigContractAndBalances } from 'helpers/MultiSig/MultiSigSmartContractHelper';
import { setVerifiedWebContractAndBalances } from 'helpers/Web/WebContractHelper';

export const COMPARE_DIALOG_NAME = 'CompareDialog';

export const setCompareLoadContractResult = (value: ILoadContractResult, isOpen: boolean = true) => {
    store.dispatch(mainStateActions.setDialog({ name: COMPARE_DIALOG_NAME, dialogState: { isOpen, value } }));
};

export const useCompareSmartContractDialog = () => {
    const dialogState = useSelector((state: RootState) => state.mainState.dialogs[COMPARE_DIALOG_NAME]);

    const isOpen = dialogState != null && dialogState.isOpen;

    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: COMPARE_DIALOG_NAME, isOpen: newIsOpen }));
    };

    const loadContractResult = dialogState?.value as ILoadContractResult;

    return { isOpen, loadContractResult, setOpen };
};

const Container = styled('div')(css`
    display: flex;
    flex-direction: column;
    gap: 20px;
`);

const WarningSpan = styled('span')(css`
    color: red;
    font-weight: bold;
`);

const OkSpan = styled('span')(css`
    color: green;
    font-weight: bold;
`);

const Description = styled('div')(css`
    flex-grow: 0;
    flex-basis: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    & div:nth-of-type(1) {
        flex-grow: 1;
    }
`);

const StyledCode = styled(Code)(css`
    box-shadow: black 0px 1px 13px 11px;
`);

const diffStyle = {
    added: {
        color: '#313131',
        backgroundColor: 'lightgreen',
    },
    removed: {
        color: '#313131',
        backgroundColor: 'salmon',
    },
    default: {},
};

const CompareSmartContractDialog: React.FC = () => {
    const { isOpen, setOpen, loadContractResult } = useCompareSmartContractDialog();
    const [diffMethod, setDiffMethod] = useState<DiffMethod>(DiffMethod.Lines);

    const isFine = loadContractResult && loadContractResult.contract.code === loadContractResult.contract.compareCode ? true : false;

    const title = isFine ? (
        <>
            SmartContract Comparison - <OkSpan>Verified</OkSpan>
        </>
    ) : (
        <>
            SmartContract Comparison - <WarningSpan>Caution</WarningSpan>
        </>
    );

    const description = isFine ? (
        'This contract has the same code this app would generate.'
    ) : (
        <>
            This contract is not what this Website would have generated, please check the differences and in case of any doubt <WarningSpan>DO NOT USE!</WarningSpan>.
        </>
    );

    const handleClose = () => {
        setOpen(false);
    };

    const handleDiffMethodChange = (dm: DiffMethod) => {
        setDiffMethod(dm);
    };

    const handleLoad = useCallback(() => {
        if (loadContractResult?.contract.contractType === 'MULTISIGNATURE') {
            setVerifiedMultiSigContractAndBalances(loadContractResult);
        } else if (loadContractResult?.contract.contractType === 'GUARANTEE') {
            setVerifiedGuaranteeContractAndBalances(loadContractResult);
        } else if (loadContractResult?.contract.contractType === 'WEB') {
            setVerifiedWebContractAndBalances(loadContractResult);
        }

        setOpen(false);
    }, [loadContractResult]);

    const compareContract = loadContractResult?.contract;

    if (!compareContract) return <></>;

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
            <DialogTitle id="sigcheck-dialog-title"> {title} </DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Container>
                    <Description>
                        <div>{description}</div>
                        <MethodSelect value={diffMethod} onChange={handleDiffMethodChange} />
                    </Description>
                    <StyledCode>
                        <StringDiff method={diffMethod} styles={diffStyle} oldValue={compareContract.compareCode!} newValue={compareContract.code!} />
                    </StyledCode>
                </Container>
            </DialogContent>
            <DialogActions>
                {isFine ? (
                    <>
                        <Button variant="text" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleLoad}>
                            Load
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="text" onClick={handleLoad}>
                            Load Anyway
                        </Button>
                        <Button variant="contained" onClick={handleClose}>
                            Reject
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CompareSmartContractDialog;
