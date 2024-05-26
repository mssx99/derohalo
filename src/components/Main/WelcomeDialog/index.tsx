import React, { useId, useEffect, useState } from 'react';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionForDialog } from 'components/common/Transitions';
import { DialogCloseButton } from 'components/Main/Dialogs';

import { styled } from '@mui/material/styles';

import { create } from 'zustand';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import { Body, HeaderTitle } from 'components/common/TextElements';
import Button from '@mui/material/Button';
import ProtocolHandlerCheck from './ProtocolHandlerCheck';
import LocalStorage from 'browserStorage/localStorage';
import { VERSION } from 'Constants';
import Link from '@mui/material/Link';
import { Code } from 'components/common/CodeDisplay';

type StoreState = {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
};

const useStore = create<StoreState>((set) => ({
    isOpen: false,
    setOpen: (isOpen) => set({ isOpen }),
}));

export const openWelcomeScreen = (isStartup: boolean = false) => {
    const setOpen = useStore.getState().setOpen;
    if (isStartup) {
        if (LocalStorage.getShowWelcomeScreenOnStartup()) {
            setOpen(true);
        }
        return;
    }
    setOpen(true);
};

export const useWelcomeDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
} = () => {
    const isOpen = useStore((state) => state.isOpen);
    const setOpen = useStore((state) => state.setOpen);

    return { isOpen, setOpen };
};

const Paragraph = styled(Body)`
    margin: 10px 0;
    text-align: justify;
`;

const TitleContainer = styled('div')`
    display: flex;
    flex-direction: row;
    gap: 20px;
`;

const VersionContainer = styled('div')`
    font-family: 'AlarmClock', sans-serif;
    font-size: 18px;
    align-self: end;
    margin-left: 6px;
`;

const WelcomeDialog: React.FC = () => {
    const { isOpen, setOpen } = useWelcomeDialog();
    const [isExited, setExited] = useState(false);

    const id_scrollDialogTitle = useId();

    useEffect(() => {
        if (isOpen) {
            setExited(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleExit = () => {
        setExited(true);
    };

    const handleDoNotShow = () => {
        LocalStorage.setShowWelcomeScreenOnStartup(false);
        handleClose();
    };

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
            TransitionProps={{
                onExited: () => {
                    handleExit();
                },
            }}
            aria-labelledby={id_scrollDialogTitle}
        >
            <DialogTitle id={id_scrollDialogTitle}>
                <TitleContainer>
                    <div>Welcome to</div> <img src="./derohaloLogo.png" />
                    <VersionContainer>{VERSION}</VersionContainer>
                </TitleContainer>
            </DialogTitle>
            <DialogContent dividers>
                <DialogCloseButton onClose={handleClose} />
                {(isOpen || !isExited) && <ProtocolHandlerCheck />}
                <Paragraph component="div">
                    <b>Installation:</b> For testing with the xswd-protocol please download and run the Dero-Simulator for <Link href="./Downloads/simulator-linux-amd64">Linux</Link> or{' '}
                    <Link href="./Downloads/simulator-windows-amd64.exe">Windows</Link>. You then need to execute the following line from the Download directory (or some subdirectory moving the file
                    there):
                    <Code>
                        chmod +x ./simulator-linux-amd64
                        <br />
                        ./simulator-linux-amd64 --use-xswd
                    </Code>
                    or alternatively for Windows:
                    <Code>./simulator-windows-amd64.exe --use-xswd</Code>
                    After that go to the Web Tab on the Website using the following link:{' '}
                    <Link href="https://derohalo.crypto-widget.com?xswdport=40000">https://derohalo.crypto-widget.com?xswdport=40000</Link> and click "Install your own WebContract".
                    <br />
                    The parameter xswdport is necessary for the simulator which uses ports 40000 to 40021 for executing on different wallets. The owner of the webcontract here would be the first
                    wallet at 40000. If you want to test connecting as a different user just change the parameter to any of the other ports like 40005. If not provided it will try to connect at port
                    44326 which is the port for a real wallet application. For more information please go to the <Link href="https://github.com/mssx99/derohalo">derohalo github repository</Link>.
                </Paragraph>
                <Paragraph>
                    This software is provided "as is" as an alpha version and only is for evaluation purposes. It serves the purpose of demonstrating what is possible using Dero as a showcase. Please
                    check it thoroughly and report any bugs or missing features that you would like to see. You are also invited to send in PRs.
                </Paragraph>
                <Paragraph>
                    As I am no lawyer, check with your local government if any regulations apply regarding the functionality which DeroHalo provides. Use specialized lawyers to determine what can be
                    done with this software in your jurisdiction before using the software and generated SmartContracts. Please audit the generated SmartContracts in technical and legal regards.
                </Paragraph>
                <Paragraph>The usage of encrypted chat without eavesdropping or IP might be illegal as well in your jurisdiction. Please check with your lawyer.</Paragraph>

                <Paragraph>
                    If you want to support further development of the app you can send a donation to the following Dero Address:
                    <br />
                    dero1qyh0p5lh2dl0x6kjlwpu7kz3m2emya9dchlqts4e5m70qfft90u25qgd3fucy
                </Paragraph>
                <Paragraph style={{ fontWeight: 'bold' }}>
                    Warning: As of May 24th 2024 there was a security gap detected which allows the metainformation to be decrypted in a Dero transaction, that includes the sender, receiver, amount
                    and message. A fix has been proposed already which, if approved by the community and audited by top cryptography experts should close the gap and provide bullet-proof encryption.
                    Until then this information should be considered public.
                </Paragraph>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDoNotShow}>Do not show again</Button>
                <Button onClick={handleClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WelcomeDialog;
