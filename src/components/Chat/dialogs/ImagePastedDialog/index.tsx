import React, { useEffect, useRef, useState, useCallback, useMemo, useId } from 'react';
import Button from '@mui/material/Button';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogCloseButton } from 'components/Main/Dialogs';
import { TransitionForDialog } from 'components/common/Transitions';
import { TransitionProps } from '@mui/material/transitions';

import { create } from 'zustand';
import { fileOrBlobToBase64 } from 'helpers/Helper';
import { addSnackbar } from 'components/screen/Snackbars';
import { DEFAULT_IMAGE_OPTIONS, MESSAGE_SEVERITY } from 'Constants';

import { styled } from '@mui/material/styles';
import { addNewImageToChat, chatSendBinary, getEstimatedTransferCost, getEstimatedTransfers, sendMessage } from 'helpers/ChatHelper';
import OptionsConfigurator from './OptionsConfigurator';
import Preview from './Preview';
import { useCurrentChat } from 'hooks/chatHooks';
import DeroAmountField from 'components/common/DeroAmountField';
import DeroAmount from 'components/common/DeroAmount';
import { NumberFormatValues } from 'react-number-format';
import { Body, Small } from 'components/common/TextElements';
import { useIsConnected, useWalletBalance } from 'hooks/deroHooks';
import { compressImage } from 'helpers/ImageHelper';

type StoreState = {
    isOpen: boolean;
    setOpen: (newOpen: boolean) => void;
    image: File | null;
    setImage: (newImage: File | null, isOpen?: boolean) => void;
};

const useStore = create<StoreState>((set) => ({
    isOpen: false,
    setOpen: (isOpen) => set({ isOpen }),
    image: null,
    setImage: (image: File | null, isOpen: boolean = true) => set({ image, isOpen }),
}));

export const useImagePastedDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
    imageFile: File | null;
    setImageFile: (newImage: File | null, isOpen?: boolean) => void;
} = () => {
    const isOpen = useStore((state) => state.isOpen);
    const setOpen = useStore((state) => state.setOpen);
    const imageFile = useStore((state) => state.image);
    const setImageFile = useStore((state) => state.setImage);

    return { isOpen, setOpen, imageFile, setImageFile };
};

const StyledDialogActions = styled(DialogActions)`
    align-items: stretch;
`;

const ImagePastedDialog: React.FC = () => {
    const isConnected = useIsConnected();
    const walletBalance = useWalletBalance();
    const { isOpen, setOpen, imageFile, setImageFile } = useImagePastedDialog();
    const [compressedFile, setCompressedFile] = useState<File>();
    const [compressedBase64, setCompressedBase64] = useState<string>('');
    const [compressedBytes, setCompressedBytes] = useState<number>(0);
    const [estimatedTransfers, setEstimatedTransfers] = useState<number>(0);

    const [amountSent, setAmountSent] = useState<number>(0);
    const amountSentRef = useRef(0);
    amountSentRef.current = amountSent;

    const currentChat = useCurrentChat();

    const [options, setOptions] = useState<IImageOptions>(DEFAULT_IMAGE_OPTIONS);
    const [fileTooBigShown, setFileTooBigShown] = useState(false);

    const id_scrollDialogTitle = useId();

    useEffect(() => {
        setOptions({ ...DEFAULT_IMAGE_OPTIONS });
        setAmountSent(0);
        setFileTooBigShown(false);
    }, [imageFile]);

    useEffect(() => {
        if (!imageFile) {
            setCompressedFile(undefined);
            return;
        }

        compressImage(imageFile, options)
            .then((compressedFile) => {
                setCompressedFile(compressedFile);
            })
            .catch((err) => {
                addSnackbar({ message: 'An error occurred converting the image.', severity: MESSAGE_SEVERITY.ERROR });
            });
    }, [options]);

    useEffect(() => {
        let active = true;
        if (compressedFile) {
            fileOrBlobToBase64(compressedFile).then((base64) => {
                if (active) {
                    setCompressedBase64(base64);
                    setCompressedBytes(base64.length);
                    const transfers = getEstimatedTransfers(base64.length);
                    setEstimatedTransfers(transfers);
                    if (amountSentRef.current < transfers) setAmountSent(transfers);
                }
            });
        } else {
            setCompressedBase64('');
            setCompressedBytes(0);
            setEstimatedTransfers(0);
        }

        return () => {
            active = false;
        };
    }, [compressedFile]);

    const minTransferLabel = useMemo(
        () => (
            <span>
                Total amount (min: <DeroAmount value={estimatedTransfers} />)
            </span>
        ),
        [estimatedTransfers]
    );

    const totalCost = useMemo(() => {
        return getEstimatedTransferCost(estimatedTransfers) + amountSent;
    }, [estimatedTransfers, amountSent]);

    const sendText = useMemo(
        () => (
            <span>
                Send
                <Small>
                    (Cost&nbsp;
                    <DeroAmount value={totalCost} />)
                </Small>
            </span>
        ),
        [totalCost]
    );

    const handleAmountSentChange = useCallback(
        (amount: number) => {
            setAmountSent(amount);
            if (amount < estimatedTransfers) {
                setTimeout(() => {
                    setAmountSent(estimatedTransfers);
                }, 0);
            }
            if (estimatedTransfers > 256 && !fileTooBigShown) {
                setFileTooBigShown(true);
                addSnackbar({ message: 'File is too big, please reduce quality.', severity: MESSAGE_SEVERITY.ERROR });
            }
        },
        [estimatedTransfers, fileTooBigShown]
    );

    const isAllowedAmount = useCallback(
        (nfv: NumberFormatValues) => {
            const value = Math.round(parseFloat(nfv.value) * 100000);

            return value >= estimatedTransfers;
        },
        [estimatedTransfers]
    );

    const handleClose = useCallback(() => {
        setOpen(false);
    }, []);

    const handleSend = useCallback(() => {
        if (!currentChat?.otherParty?.address || !compressedBase64 || !compressedFile || estimatedTransfers > 256 || !isConnected || totalCost > walletBalance) return;
        sendMessage(currentChat.otherParty.address, compressedBase64, amountSent, compressedFile.type);
        handleClose();
    }, [currentChat, compressedFile, compressedBase64, amountSent, estimatedTransfers, walletBalance, isConnected]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter') {
                handleSend();
                event.preventDefault();
            }
        },
        [handleSend]
    );

    if (!imageFile) return <></>;

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
            onKeyDown={handleKeyDown}
            scroll="paper"
            TransitionComponent={TransitionForDialog}
            aria-labelledby={id_scrollDialogTitle}
        >
            <DialogTitle id={id_scrollDialogTitle}>Image Configurator/Compressor</DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                <OptionsConfigurator value={options} onChange={(options) => setOptions(options)} />
                <Preview imageFile={imageFile} compressedFile={compressedFile} base64bytes={compressedBase64?.length ?? 0} />
            </DialogContent>
            <StyledDialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <DeroAmountField label={minTransferLabel} value={amountSent} onValueChange={handleAmountSentChange} isAllowed={isAllowedAmount} />
                {compressedBase64 && (
                    <Button variant="contained" onClick={handleSend} disabled={estimatedTransfers > 256 || !isConnected || walletBalance < totalCost}>
                        {sendText}
                    </Button>
                )}
            </StyledDialogActions>
        </Dialog>
    );
};

export default ImagePastedDialog;
