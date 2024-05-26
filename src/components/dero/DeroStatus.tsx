import React from 'react';
import SignalWifi0BarIcon from '@mui/icons-material/SignalWifi0Bar';
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';
import LoadingIconButton from 'components/common/LoadingIconButton';
import { doConnect, doDisconnect, useBusy, useIsConnected } from 'hooks/deroHooks';

const DeroStatus: React.FC = () => {
    const isConnected = useIsConnected();
    const isBusy = useBusy();

    return isConnected ? (
        <LoadingIconButton aria-label="Dero is disconnected." color="primary" loading={isBusy} onClick={doDisconnect}>
            <SignalWifi4BarIcon />
        </LoadingIconButton>
    ) : (
        <LoadingIconButton aria-label="Dero is connected." color="secondary" loading={isBusy} onClick={doConnect}>
            <SignalWifi0BarIcon />
        </LoadingIconButton>
    );
};

export default DeroStatus;
