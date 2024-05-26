import React from 'react';
import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import MuiAlert, { AlertProps, AlertColor } from '@mui/material/Alert';

import { mainStateActions } from 'store/reducers/mainStateReducer';
import { SNACKBAR_AUTOHIDE_DURATION } from 'Constants';

export const addSnackbar = (snackbar: ISnackbar) => {
    store.dispatch(mainStateActions.addSnackbar({ snackbar }));
};

export const removeSnackbar = (snackbarId: string) => {
    store.dispatch(mainStateActions.removeSnackbar(snackbarId));
};

export const useSnackbars: () => { snackbars: ISnackbar[] } = () => {
    const snackbars = useSelector((state: RootState) => state.mainState.snackbars);

    return { snackbars };
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Snackbars: React.FC = () => {
    const { snackbars } = useSnackbars();
    const [open, setOpen] = React.useState<boolean>(false);
    const [messageInfo, setMessageInfo] = React.useState<ISnackbar>();

    React.useEffect(() => {
        if (snackbars.length && !messageInfo) {
            const currentSnackbar = snackbars[0];
            setMessageInfo({ ...currentSnackbar });
            removeSnackbar(currentSnackbar.id as string);
            setOpen(true);
        } else if (snackbars.length && messageInfo && open) {
            setOpen(false);
        }
    }, [snackbars, messageInfo, open]);

    const handleClose = (event: Event | React.SyntheticEvent<any, Event>, reason: SnackbarCloseReason | undefined) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleExited = () => {
        setMessageInfo(undefined);
    };

    let action = null;
    if (messageInfo?.action && messageInfo?.action.type === 'plugin') {
        const browserInfo = messageInfo?.action.payload;
        if (browserInfo != null) {
            action = (
                <Button
                    color="info"
                    size="small"
                    href={browserInfo.downloadPlugin}
                    target="_blank"
                    onClick={(e) => {
                        handleClose(e, undefined);
                    }}
                >
                    Install Dero RPC Bridge Plugin
                </Button>
            );
        }
    }

    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            key={messageInfo?.id}
            open={open}
            autoHideDuration={messageInfo?.autoHideDuration ?? SNACKBAR_AUTOHIDE_DURATION}
            onClose={handleClose}
            TransitionProps={{ onExited: handleExited }}
        >
            <Alert
                onClose={(e) => {
                    handleClose(e, undefined);
                }}
                severity={messageInfo?.severity as AlertColor}
                sx={{ width: '100%' }}
                action={action}
            >
                {messageInfo?.message}
            </Alert>
        </Snackbar>
    );
};

export default Snackbars;
