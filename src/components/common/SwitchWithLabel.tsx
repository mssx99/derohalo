import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch, { SwitchProps } from '@mui/material/Switch';

interface Props {
    label?: string;
    labelPlacement?: 'end' | 'start' | 'top' | 'bottom' | undefined;
    color?: string;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
    size?: SwitchProps['size'];
    inputProps?: SwitchProps['inputProps'];
}

const SwitchWithLabel: React.FC<Props> = ({ label, labelPlacement, color, checked, disabled, onChange, size, inputProps }) => {
    if (!color) color = '#fff';

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange && onChange(event.target.checked);
    };

    return (
        <FormControlLabel
            sx={{ color }}
            control={<Switch checked={checked} onChange={handleChange} size={size} inputProps={inputProps} disabled={disabled} />}
            label={label}
            labelPlacement={labelPlacement}
        />
    );
};

export default SwitchWithLabel;
