import React, { useId, useState, useEffect, useMemo, useCallback } from 'react';
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
import { useContract, useContractStats } from 'hooks/guaranteeHooks';
import { calculateTotalGuaranteeFee, registerGuarantee, removeListing, useCurrentGuaranteeContractListing, useContract as useWebContract } from 'hooks/webHooks';
import Form, { FormElement } from 'components/common/Form';
import { Body } from 'components/common/TextElements';
import { styled } from '@mui/material/styles';
import CommissionTable from './CommissionTable';
import { updateWalletBalance, useBlockchainInfo } from 'hooks/deroHooks';
import { convertBlocksToFormattedTime } from 'helpers/FormatHelper';
import PurchaseSlider from './PurchaseSlider';
import { GUARANTEE_CHARLIMIT_MARKET, MESSAGE_SEVERITY } from 'Constants';
import { addSnackbar } from 'components/screen/Snackbars';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { loadContractAndSet } from 'helpers/Web/WebContractHelper';
import MaxLengthTextField from 'components/common/MaxLengthTextField';

const REGISTER_GUARANTEE_DIALOG_NAME = 'RegisterGuaranteeDialog';

export const useRegisterGuaranteeDialog = () => {
    const dialogState = useSelector((state: RootState) => state.mainState.dialogs[REGISTER_GUARANTEE_DIALOG_NAME]);

    const isOpen = dialogState != null && dialogState.isOpen;

    const setOpen = (newIsOpen: boolean = true) => {
        store.dispatch(mainStateActions.setDialogOpen({ name: REGISTER_GUARANTEE_DIALOG_NAME, isOpen: newIsOpen }));
    };

    return { isOpen, setOpen };
};

const Container = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const RegisterGuaranteeDialog: React.FC = () => {
    const { isOpen, setOpen } = useRegisterGuaranteeDialog();
    const { contract } = useContract();
    const existingListing = useCurrentGuaranteeContractListing();
    const [statusText, setStatusText] = useState<React.ReactNode>(null);

    const stats = useContractStats();
    const [exited, setExited] = useState(true);

    const webContract = useWebContract();

    const [purchasedPackages, setPurchasedPackages] = useState(0);
    const [market, setMarket] = useState<string>('');

    const id_scrollDialogTitle = useId();

    useEffect(() => {
        if (isOpen) {
            setExited(false);
            setMarket(existingListing?.market ?? '');
            setPurchasedPackages(1);

            if (existingListing) {
                switch (existingListing.state) {
                    case 'PENDING_APPROVAL':
                        setStatusText(
                            <Body>
                                The Listing is currently PENDING_APPROVAL, the website owner needs to approve it first. If he does not approve it, the last payment will be returned. Do not extend the
                                listing by purchasing more packages in a separate transaction. This will make the the first payment unrecoverable for you. <br />
                                If you press Remove Listing while it is PENDING_APPROVAL you will be returned your money.
                            </Body>
                        );
                        break;
                    case 'ACTIVE':
                        setStatusText(<Body>The Listing is currently ACTIVE.</Body>);
                        break;
                    default:
                        setStatusText(null);
                }
            } else {
                setStatusText(null);
            }
        }
    }, [isOpen, existingListing]);

    const fees = useMemo(() => {
        if (!webContract) return 0;
        return calculateTotalGuaranteeFee(webContract, contract, stats, purchasedPackages);
    }, [webContract, contract, stats, purchasedPackages]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleExit = () => {
        setExited(true);
    };

    const handleMarketChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
        setMarket(value);
    };

    const handleRemoveListingClick = useCallback(async () => {
        if (!webContract?.scid || !contract?.scid) return;
        setBusyBackdrop(true, 'Listing this Guarantee in Market...');
        try {
            await removeListing(webContract.scid, contract.scid);
            addSnackbar({ message: 'The listing has been removed successfully.', severity: MESSAGE_SEVERITY.SUCCESS });
            await loadContractAndSet(webContract.scid, false);
            updateWalletBalance();
            handleClose();
        } catch (e) {
            console.error(e);
            addSnackbar({ message: 'An error ocurred.', severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [webContract, contract]);

    const handlePurchaseClick = useCallback(async () => {
        if (!webContract?.scid || !contract?.scid || !stats) return;
        setBusyBackdrop(true, 'Listing this Guarantee in Market.');
        try {
            await registerGuarantee(webContract.scid, fees, contract.scid, market, purchasedPackages, stats.a_RequiredDeposit + stats.b_RequiredDeposit);
            addSnackbar({ message: 'The Guarantee has been listed successfully.', severity: MESSAGE_SEVERITY.SUCCESS });
            await loadContractAndSet(webContract.scid, false);
            updateWalletBalance();
            handleClose();
        } catch (e) {
            console.error(e);
            addSnackbar({ message: 'An error ocurred.', severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [webContract, contract, fees, market, purchasedPackages, stats]);

    if (!webContract) return <></>;

    return (
        <Dialog
            sx={{
                '& .MuiDialog-container': {
                    '& .MuiPaper-root': {
                        width: '50rem',
                        maxWidth: '100%',
                    },
                },
            }}
            open={isOpen}
            onClose={handleClose}
            TransitionProps={{
                onExited: () => {
                    handleExit();
                },
            }}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            aria-labelledby={id_scrollDialogTitle}
        >
            <DialogTitle id={id_scrollDialogTitle}>Register Guarantee in Website</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <Container>
                    <Body>Here you can purchase a listing on this webContract, so that others can find it in the Listings-Tab.</Body>
                    {statusText}
                    <Form>
                        <FormElement label="Market">
                            <MaxLengthTextField label="Market" value={market} onChange={handleMarketChange} fullWidth charLimit={GUARANTEE_CHARLIMIT_MARKET} />
                        </FormElement>
                    </Form>
                    <CommissionTable webContract={webContract} guaranteeContract={contract} stats={stats} purchasedPackages={purchasedPackages} />
                    {!exited && <PurchaseSlider value={purchasedPackages} onChange={setPurchasedPackages} />}
                </Container>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleRemoveListingClick} disabled={!existingListing}>
                    Remove Listing
                </Button>
                <Button onClick={handlePurchaseClick} variant="contained" disabled={purchasedPackages === 0}>
                    Purchase
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegisterGuaranteeDialog;
