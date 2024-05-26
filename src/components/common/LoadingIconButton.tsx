import React from 'react';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

interface ILoadingIconButton extends IconButtonProps {
    loading: boolean;
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
        marginLeft: '0rem',
    },
});

const LoadingIconButton: React.FC<ILoadingIconButton> = ({ loading, children, disabled, ...props }) => {
    if (loading) disabled = true;
    return (
        <div style={{ margin: 'auto 0' }}>
            <Container>
                <IconButton disabled={disabled} {...props}>
                    {children}
                </IconButton>
                <div>{loading && <CircularProgress size={16} />}</div>
            </Container>
        </div>
    );
};

export default LoadingIconButton;
