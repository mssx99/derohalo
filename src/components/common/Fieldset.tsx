import React from 'react';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

const Container = styled('fieldset')({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '10px',
    paddingTop: 30,
    backgroundColor: '#0003',
    minWidth: 'inherit',
});

const Legend = styled(Typography)(({ theme }) => ({
    position: 'absolute',
    top: '-10px',
    left: '10px',
    color: 'white',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #ccc',
    borderRadius: '10px',
    padding: '0 10px',
}));

interface IFieldset {
    title: React.ReactNode;
    children: React.ReactNode;
}
const Fieldset: React.FC<IFieldset> = ({ title, children }) => {
    return (
        <Container>
            <Legend variant="body1">{title}</Legend>
            {children}
        </Container>
    );
};

export default Fieldset;
