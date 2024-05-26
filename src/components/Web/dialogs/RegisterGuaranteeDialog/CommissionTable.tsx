import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableFooter from '@mui/material/TableFooter';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { formatNumber } from 'helpers/FormatHelper';
import DeroAmount from 'components/common/DeroAmount';
import { MAX_GUARANTEE_PERCENTAGE } from 'Constants';
import { calculateTotalGuaranteeFee } from 'hooks/webHooks';
import { SxProps } from '@mui/system';

interface ICommissionTable {
    webContract: IWebContract;
    guaranteeContract: IGuaranteeContract;
    stats: IGuaranteeStats;
    purchasedPackages: number;
}

const CommissionTable: React.FC<ICommissionTable> = ({ webContract, guaranteeContract, stats, purchasedPackages }) => {
    if (!webContract) return <></>;
    const type = webContract.guaranteePublishFee > MAX_GUARANTEE_PERCENTAGE ? 'Fixed' : webContract.guaranteePublishFeeMinimum > 0 ? 'Percentage with Minimum' : 'Percentage';

    let publishCom: React.ReactNode;

    switch (type) {
        case 'Fixed':
            publishCom = <DeroAmount value={webContract.guaranteePublishFee - MAX_GUARANTEE_PERCENTAGE - 1} />;
            break;
        case 'Percentage':
            let p = webContract.guaranteePublishFee / 1000;
            publishCom = formatNumber(p, 0, 3) + '%';
            break;
        default:
            p = webContract.guaranteePublishFee / 1000;
            const min = webContract.guaranteePublishFeeMinimum;
            return (
                <>
                    <span>{formatNumber(p, 0, 3) + '%'} / Min.</span>
                    <DeroAmount value={min} />
                </>
            );
    }

    const publishFee = calculateTotalGuaranteeFee(webContract, guaranteeContract, stats);
    const publishTotal = calculateTotalGuaranteeFee(webContract, guaranteeContract, stats, purchasedPackages);

    return (
        <TableContainer component={Paper}>
            <Table aria-label="commission table">
                <TableHead>
                    <TableRow>
                        <TableCell>Commission</TableCell>
                        <TableCell align="right"></TableCell>
                        <TableCell align="right">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TRow
                        item={`Price for each package (package-size in blocks: ${formatNumber(webContract.guaranteeBlockPackageSize, 0, 0)})`}
                        value={<DeroAmount value={webContract.guaranteeBlockPackagePrice} />}
                        total={<DeroAmount value={purchasedPackages * webContract.guaranteeBlockPackagePrice} />}
                    />
                    <TRow item={`Price for publishing (${type})`} value={publishCom} total={<DeroAmount value={publishFee} />} />
                    <TRow value="Total Cost" total={<DeroAmount value={publishTotal} />} sx={{ fontWeight: 'bold', color: 'red', fontSize: '1.1rem' }} />
                </TableBody>
            </Table>
        </TableContainer>
    );
};

interface ITRow {
    item?: React.ReactNode;
    value?: React.ReactNode;
    total?: React.ReactNode;
    sx?: SxProps;
}

const TRow: React.FC<ITRow> = ({ item, value, total, sx }) => {
    return (
        <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component="th" scope="row">
                {item}
            </TableCell>
            <TableCell align="right">{value}</TableCell>
            <TableCell align="right" sx={{ width: '6rem', ...sx }}>
                {total}
            </TableCell>
        </TableRow>
    );
};

export default CommissionTable;
