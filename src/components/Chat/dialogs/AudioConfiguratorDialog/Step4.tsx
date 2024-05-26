import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Button from '@mui/material/Button';
import { AudioVisualizer } from 'react-audio-visualize';
import { VisualizerBackground, useAudioConfiguratorDialog } from '.';
import { useIsConnected, useWalletBalance } from 'hooks/deroHooks';
import { useCurrentChat } from 'hooks/chatHooks';
import DeroAmount from 'components/common/DeroAmount';
import { getEstimatedTransferCost, getEstimatedTransfers, sendMessage } from 'helpers/ChatHelper';
import { Small } from 'components/common/TextElements';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import { NumberFormatValues } from 'react-number-format';
import { fileOrBlobToBase64 } from 'helpers/Helper';
import DeroAmountField from 'components/common/DeroAmountField';
import { styled } from '@mui/material/styles';
import AudioPlayer from 'components/common/AudioPlayer';

// Final send screen

const Controls = styled('div')`
    display: flex;
    justify-content: space-around;
`;

const Step4: React.FC<IDialogPortal> = ({ contentId, actionsId }) => {
    const isConnected = useIsConnected();
    const walletBalance = useWalletBalance();
    const visualizerRef = useRef<HTMLCanvasElement>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const { blob, setStep, setOpen } = useAudioConfiguratorDialog();

    const [estimatedTransfers, setEstimatedTransfers] = useState<number>(0);
    const [fileTooBigShown, setFileTooBigShown] = useState(false);
    const [amountSent, setAmountSent] = useState<number>(0);
    const amountSentRef = useRef(0);
    amountSentRef.current = amountSent;

    const [compressedBase64, setCompressedBase64] = useState<string>('');
    const [compressedBytes, setCompressedBytes] = useState<number>(0);

    const currentChat = useCurrentChat();

    useEffect(() => {
        let active = true;
        let url: string | null = null;
        if (blob) {
            fileOrBlobToBase64(blob).then((base64) => {
                if (active) {
                    setCompressedBase64(base64);
                    setCompressedBytes(base64.length);
                    const transfers = getEstimatedTransfers(base64.length);
                    setEstimatedTransfers(transfers);
                    if (amountSentRef.current < transfers) setAmountSent(transfers);
                }
            });
            url = URL.createObjectURL(blob);
            setAudioUrl(url);
        } else {
            setCompressedBase64('');
            setCompressedBytes(0);
            setEstimatedTransfers(0);
        }

        return () => {
            active = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [blob]);

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
    }, [setOpen]);

    const handleEditClick = () => {
        setStep(2);
    };

    const handleSend = useCallback(() => {
        if (!currentChat?.otherParty?.address || !compressedBase64 || !blob || estimatedTransfers > 256 || !isConnected || totalCost > walletBalance) return;
        sendMessage(currentChat.otherParty.address, compressedBase64, amountSent, blob.type);
        handleClose();
    }, [currentChat, blob, compressedBase64, amountSent, estimatedTransfers, walletBalance, isConnected, handleClose]);

    const handlePlayClick = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    const dialogContent = (
        <VisualizerBackground>
            <AudioPlayer blob={blob ?? undefined} width={698} />
        </VisualizerBackground>
    );

    const dialogActions = (
        <>
            <Button onClick={handleEditClick}>Edit</Button>
            <DeroAmountField label={minTransferLabel} value={amountSent} onValueChange={handleAmountSentChange} isAllowed={isAllowedAmount} />
            {blob && (
                <Button variant="contained" onClick={handleSend} disabled={estimatedTransfers > 256 || !isConnected || walletBalance < totalCost}>
                    {sendText}
                </Button>
            )}
        </>
    );

    return (
        <>
            {ReactDOM.createPortal(dialogContent, document.getElementById(contentId)!)}
            {ReactDOM.createPortal(dialogActions, document.getElementById(actionsId)!)}
        </>
    );
};

export default Step4;
