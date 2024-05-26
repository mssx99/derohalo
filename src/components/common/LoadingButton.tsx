import React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

interface ILoadingButton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading: boolean;
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | undefined;
    children: React.ReactNode;
}

const Container = styled('div')({
    position: 'relative',
    display: 'inline',
    paddingBottom: '0.375rem',
    paddingTop: '0.375rem',
    '& > div': {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        marginTop: '0.25rem',
        marginLeft: '0.125rem',
    },
});

const LoadingButton: React.FC<ILoadingButton> = ({ loading, children, disabled, className, color = 'primary', ...props }) => {
    if (loading) disabled = true;
    return (
        <div style={{ margin: 'auto 0' }} className={className}>
            <Container>
                <Button color={color} disabled={disabled} {...props}>
                    {children}
                </Button>
                <div>{loading && <CircularProgress size={16} />}</div>
            </Container>
        </div>
    );
};

export default LoadingButton;
