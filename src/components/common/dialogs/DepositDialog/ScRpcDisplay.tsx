import React, { useMemo } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { Body } from 'components/common/TextElements';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

interface IScRpcDisplay {
    value?: IRpc_Arguments[];
}

const TITLE = 'Sc-RPC-Parameters';

const ScRpcDisplay: React.FC<IScRpcDisplay> = ({ value }) => {
    const title = useMemo(() => {
        const entrypoint = value?.find((s) => s.name === 'entrypoint')?.value;
        if (entrypoint) {
            return `${TITLE} (entrypoint "${entrypoint}")`;
        } else {
            return TITLE;
        }
    }, [value]);
    if (!value || value.length == 0) return <></>;

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
                <Body>{title}</Body>
            </AccordionSummary>
            <AccordionDetails>
                <Body>These will be sent together with the request.</Body>

                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell align="right">DataType</TableCell>
                                <TableCell align="right">Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {value.map((row, index) => (
                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component="th" scope="row">
                                        {row.name}
                                    </TableCell>
                                    <TableCell align="right">{row.datatype}</TableCell>
                                    <TableCell align="right">{row.value}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </AccordionDetails>
        </Accordion>
    );
};

export default ScRpcDisplay;
