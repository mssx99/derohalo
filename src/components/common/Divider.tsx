import React from 'react';
import MuiDivider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

interface IDivider {
    value: string;
}

const Divider: React.FC<IDivider> = ({ value }) => {
    return (
        <MuiDivider>
            <Chip label={value} size="small" />
        </MuiDivider>
    );
};

export default Divider;
