import React, { ClipboardEvent, useEffect, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useAddImageDialog } from '.';

import { styled } from '@mui/material/styles';
import { fileOrBlobToBase64, fileToBlob } from 'helpers/Helper';
import TextField from 'components/common/TextField';
import FileUploadButton from 'components/common/FileUploadButton';
import { DEFAULT_IMAGE_OPTIONS, DEFAULT_THUMB_OPTIONS, MESSAGE_SEVERITY } from 'Constants';
import OptionsConfigurator from 'components/Chat/dialogs/ImagePastedDialog/OptionsConfigurator';
import Preview from './Preview';
import { addSnackbar } from 'components/screen/Snackbars';
import { compressImage } from 'helpers/ImageHelper';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { addImage, getEstimatedAddImageCost, loadContractAndSet } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { useContract } from 'hooks/guaranteeHooks';
import { updateWalletBalance, useIsConnected, useWalletAddress, useWalletBalance } from 'hooks/deroHooks';
import Button from '@mui/material/Button';
import { Small } from 'components/common/TextElements';
import DeroAmount from 'components/common/DeroAmount';
import { debounce } from 'helpers/UIHelpers';

const Container = styled('div')`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding: 10px;
`;

const DEBOUNCE_ESTIMATED_COST_DELAY = 2000;

const Step1: React.FC<IDialogPortal> = ({ contentId, actionsId }) => {
    const walletAddress = useWalletAddress();
    const walletBalance = useWalletBalance();
    const isConnected = useIsConnected();
    const { contract } = useContract();
    const { setOpen, setStep, blob, setBlob, description, setDescription } = useAddImageDialog();
    const [compressedBlob, setCompressedBlob] = useState<Blob>();
    const [compressedThumbBlob, setCompressedThumbBlob] = useState<Blob>();
    const [compressedBase64, setCompressedBase64] = useState<string>('');
    const [compressedBase64Thumb, setCompressedBase64Thumb] = useState<string>('');

    const [options, setOptions] = useState<IImageOptions>(DEFAULT_IMAGE_OPTIONS);
    const [estimatedCost, setEstimatedCost] = useState<number>(0);
    const [calculationReady, setCalculationReady] = useState(false);

    const fetchAsyncValue = async (scid: string, base64: string, base64Thumb: string, description: string, walletAddress: string) => {
        const result = await getEstimatedAddImageCost(scid, base64, base64Thumb, description, walletAddress);
        setEstimatedCost(result ?? 0);
        setCalculationReady(true);
    };

    const debouncedFetch = useCallback(debounce(fetchAsyncValue, 2000), []);

    useEffect(() => {
        if (!contract?.scid || !walletAddress) return;
        debouncedFetch(contract?.scid, compressedBase64, compressedBase64Thumb, description, walletAddress);
    }, [contract, description, compressedBase64, compressedBase64Thumb, walletAddress]);

    useEffect(() => {
        if (!blob) {
            setCompressedBlob(undefined);
            return;
        }

        const generateImages = async () => {
            const compressedBlob = await compressImage(blob, options);
            setCompressedBlob(compressedBlob);
            const compressedBase64 = await fileOrBlobToBase64(compressedBlob);
            setCompressedBase64(compressedBase64);

            const compressedThumbBlob = await compressImage(blob, DEFAULT_THUMB_OPTIONS);
            setCompressedThumbBlob(compressedThumbBlob);
            const compressedBase64Thumb = await fileOrBlobToBase64(compressedThumbBlob);
            setCompressedBase64Thumb(compressedBase64Thumb);
        };

        //setBusyBackdrop(true, 'Converting');
        generateImages()
            .catch((err) => {
                addSnackbar({ message: 'An error occurred converting the image.', severity: MESSAGE_SEVERITY.ERROR });
            })
            .finally(() => {
                //setBusyBackdrop(false);
            });
    }, [blob, options]);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const sendText = useMemo(
        () =>
            !calculationReady ? (
                'Send'
            ) : (
                <span>
                    Send
                    <Small>
                        (Cost&nbsp;
                        <DeroAmount value={estimatedCost} />)
                    </Small>
                </span>
            ),
        [estimatedCost, calculationReady]
    );

    const handleSend = useCallback(async () => {
        if (!contract?.scid || !isConnected || !walletAddress) {
            console.error('Not connected or no Guarantee SCID available.', contract?.scid, isConnected, walletAddress);
            return;
        }
        setBusyBackdrop(true, 'Adding the image to the SmartContract');
        try {
            await addImage(contract.scid, compressedBase64, compressedBase64Thumb, description ?? '', walletAddress);
            await loadContractAndSet(contract.scid, false);
            updateWalletBalance();
            addSnackbar({ message: 'Image was added successfully.', severity: MESSAGE_SEVERITY.SUCCESS });
            handleClose();
        } catch (e) {
            console.error(e);
            addSnackbar({ message: 'An error ocurred.', severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [walletAddress, contract, compressedBase64, compressedBase64Thumb, description, isConnected, handleClose]);

    const dialogContent = (
        <Container>
            <OptionsConfigurator value={options} onChange={(options) => setOptions(options)} />
            <Preview
                imageBlob={blob}
                compressedBlob={compressedBlob}
                compressedThumbBlob={compressedThumbBlob}
                base64bytes={compressedBase64?.length ?? 0}
                base64bytesThumb={compressedBase64Thumb?.length ?? 0}
            />
        </Container>
    );

    const dialogActions = (
        <>
            <Button onClick={handleSend} variant="contained" disabled={!isConnected || !calculationReady || walletBalance < estimatedCost}>
                {sendText}
            </Button>
        </>
    );

    return (
        <>
            {ReactDOM.createPortal(dialogContent, document.getElementById(contentId)!)}
            {ReactDOM.createPortal(dialogActions, document.getElementById(actionsId)!)}
        </>
    );
};

export default Step1;
