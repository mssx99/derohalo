import React, { useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import PersonIcon from '@mui/icons-material/Person';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

interface IRequiredApprovers {
    value: Uint64 | undefined;
    totalApprovers: Uint64;
    disabled?: boolean;
    onChange: (requiredApprovers: Uint64) => void;
}

const RequiredApprovers: React.FC<IRequiredApprovers> = ({ value: approvers = 0, totalApprovers, disabled, onChange }) => {
    const requiredApprovers = totalApprovers < 2 ? totalApprovers : approvers ?? 1;
    const disabledCondition = disabled || totalApprovers < 2;

    const marks = [];

    if (totalApprovers > 1) {
        for (let i = 1; i <= totalApprovers; i++) {
            marks.push({ value: i, label: `${i}/${totalApprovers}` });
        }
    }

    return (
        <Stack spacing={2} direction="row" sx={{ mb: 2 }} alignItems="center">
            <PersonIcon />
            <Slider
                aria-label="Required Approvers"
                value={requiredApprovers}
                onChange={(event: Event, newValue: number | number[]) => {
                    onChange(newValue as Uint64);
                }}
                step={1}
                marks={marks}
                min={1}
                max={totalApprovers}
                disabled={disabledCondition}
            />
            <GroupAddIcon />
        </Stack>
    );
};

export default RequiredApprovers;
