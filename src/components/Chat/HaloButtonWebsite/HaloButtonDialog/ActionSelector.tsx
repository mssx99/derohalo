import React, { useCallback, useState, useId } from 'react';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useHaloButtonDialog } from '.';
import DefaultMessage from './ChatButtonPanel/DefaultMessage';
import { createNewDefaultChatButton, createNewDefaultScidButton } from './HaloButtonHelper';

const ActionSelector: React.FC = () => {
    const { haloButtonConfig, setHaloButtonConfig } = useHaloButtonDialog();
    const id_selectLabel = useId();

    const handleChange = useCallback(
        ({ target: { value } }: SelectChangeEvent<HaloButtonActionType>) => {
            let data: IHaloButtonChatActionParameters | IHaloButtonScidActionParameters;

            if (value === 'OPEN_CHAT') {
                data = createNewDefaultChatButton();
            } else {
                data = createNewDefaultScidButton();
            }

            let defaultToolTip = '';

            switch (value) {
                case 'OPEN_CHAT':
                    defaultToolTip = 'Chat with me!';
                    break;
                case 'OPEN_MULTISIG':
                    defaultToolTip = 'Open my MultiSig-Contract!';
                    break;
                case 'OPEN_GUARANTEE':
                    defaultToolTip = 'Open my Guarantee-Contract!';
                    break;
                case 'OPEN_WEB':
                    defaultToolTip = 'Open my Web-Contract!';
                    break;
            }

            setHaloButtonConfig({ ...haloButtonConfig, action: value as HaloButtonActionType, data, tooltip: defaultToolTip });
        },
        [haloButtonConfig, setHaloButtonConfig]
    );

    return (
        <FormControl variant="filled" fullWidth>
            <InputLabel id={id_selectLabel}>Type</InputLabel>
            <Select labelId={id_selectLabel} value={haloButtonConfig.action} onChange={handleChange}>
                <MenuItem value="OPEN_CHAT">Open Chat</MenuItem>
                <MenuItem value="OPEN_MULTISIG">Open MultiSignature-Contract</MenuItem>
                <MenuItem value="OPEN_GUARANTEE">Open Guarantee-Contract</MenuItem>
                <MenuItem value="OPEN_WEB">Open Web-Contract</MenuItem>
            </Select>
        </FormControl>
    );
};

export default ActionSelector;
