import { MESSAGE_SEVERITY } from 'Constants';
import { addSnackbar } from 'components/screen/Snackbars';
import Button, { ButtonProps } from '@mui/material/Button';
import React, { useState } from 'react';

interface ICopyToClipboardButton extends ButtonProps {
    textToCopy?: string;
}

const CopyToClipboardButton: React.FC<ICopyToClipboardButton> = ({ children, textToCopy, variant = 'text', ...otherProps }) => {
    const copyToClipboard = async (text: string | undefined) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            addSnackbar({ message: 'Text copied successfully to clipboard.', severity: MESSAGE_SEVERITY.SUCCESS });
        } catch (err) {
            addSnackbar({ message: 'Failed to copy!', severity: MESSAGE_SEVERITY.ERROR });
        }
    };

    return (
        <Button {...otherProps} onClick={() => copyToClipboard(textToCopy)}>
            {children}
        </Button>
    );
};

export default CopyToClipboardButton;
