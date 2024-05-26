import React, { useState, ReactElement } from 'react';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';

interface ToggleIconButtonProps extends IconButtonProps {
    children: React.ReactNode;
    isToggled: boolean;
    onToggleChange: (toggled: boolean) => void;
}

const ToggleIconButton: React.FC<ToggleIconButtonProps> = ({ children, isToggled, onToggleChange }) => {
    const handleToggle = () => {
        onToggleChange(!isToggled);
    };

    return (
        <IconButton
            onClick={handleToggle}
            style={{
                backgroundColor: isToggled ? '#d3d3d359' : 'transparent',
                transition: 'background-color 0.3s',
            }}
        >
            {children}
        </IconButton>
    );
};

export default ToggleIconButton;
