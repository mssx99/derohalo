import React, { useId, useCallback } from 'react';
import { useConditionDialog } from '..';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import WalletRender from 'components/common/WalletRender';

import Box from '@mui/material/Box';
import { updateAuthGroup, useContract } from 'hooks/multiSigHooks';
import { Small } from 'components/common/TextElements';

const DefineUsers: React.FC = () => {
    return (
        <>
            <MultiUserSelect />
        </>
    );
};

const MultiUserSelect: React.FC = () => {
    const { contract } = useContract();
    const { authorizationGroup } = useConditionDialog();

    const id_selectUsersLabel = useId();

    const handleChange = useCallback(
        ({ target: { value } }: SelectChangeEvent<string[]>) => {
            const wallets = contract.involvedParties.filter((ip) => value.includes(ip.id));
            updateAuthGroup({ ...authorizationGroup, furtherDelay: wallets });
        },
        [authorizationGroup]
    );

    return (
        <FormControl variant="filled" fullWidth>
            <InputLabel id={id_selectUsersLabel}>Users who can add time</InputLabel>
            <Select
                labelId={id_selectUsersLabel}
                multiple
                value={authorizationGroup.furtherDelay ? authorizationGroup.furtherDelay.map((wallet) => wallet.id) : []}
                onChange={handleChange}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {selected.map((walletId) => {
                            const wallet = contract.involvedParties.find((ip) => ip.id === walletId);
                            return wallet ? <WalletRender key={wallet.id} value={wallet!} renderChatButton={false} /> : null;
                        })}
                    </Box>
                )}
            >
                {contract.involvedParties.map((ip) => (
                    <MenuItem key={ip.id} value={ip.id}>
                        {ip.alias} - <Small>{ip.address}</Small>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default DefineUsers;
