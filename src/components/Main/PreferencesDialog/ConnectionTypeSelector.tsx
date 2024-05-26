import React, { useId } from 'react';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { usePreferences } from 'hooks/mainHooks';
import LocalStorage from 'browserStorage/localStorage';
import { doDisconnect, useBusy, useIsConnected } from 'hooks/deroHooks';

const ConnectionTypeSelector: React.FC = () => {
    const isConnected = useIsConnected();
    const { connectionType, setConnectionType } = usePreferences();
    const isBusy = useBusy();

    const id_connectionTypeSelector = useId();

    const handleChange = (event: SelectChangeEvent) => {
        const newConnectionType = event.target.value as ConnectionType;

        if (newConnectionType != connectionType && isConnected) doDisconnect();

        setConnectionType(newConnectionType);
        LocalStorage.setConnectionType(newConnectionType);
    };

    return (
        <FormControl variant="filled" fullWidth>
            <InputLabel id={id_connectionTypeSelector}>Dero Connection Type</InputLabel>
            <Select labelId={id_connectionTypeSelector} value={connectionType} label="Age" onChange={handleChange} disabled={isBusy}>
                <MenuItem value={'bridge'}>Dero RPC Bridge</MenuItem>
                <MenuItem value={'xswd'}>XSWD protocol</MenuItem>
            </Select>
        </FormControl>
    );
};

export default ConnectionTypeSelector;
