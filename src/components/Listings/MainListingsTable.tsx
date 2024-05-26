import React, { ReactElement, JSXElementConstructor } from 'react';
import {
    DataGrid,
    useGridApiRef,
    GridToolbarContainer,
    GridActionsCellItem,
    GridActionsCellItemProps,
    GridRowId,
    GridRowsProp,
    GridColDef,
    GridValueGetterParams,
    GridRenderEditCellParams,
} from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import DeroAmount from 'components/common/DeroAmount';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { formatNumber } from 'helpers/FormatHelper';
import { usePaidListings } from 'hooks/webHooks';
import { styled } from '@mui/material/styles';
import DescriptionCell from './DescriptionCell';
import PartyDisplay from './PartyDisplay';
import { setCurrentTab } from 'hooks/mainHooks';
import { loadContractAndSet } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import Verified from './Verified';
import MarketScid from './MarketScid';

interface IMainListingsTable {}

const Container = styled(Paper)`
    position: absolute;
    top: 0.3125rem;
    left: 0.3125rem;
    right: 0.1875rem;
    bottom: 0.3125rem;
    background-color: #121212a1;
`;

const MainListingsTable: React.FC<IMainListingsTable> = () => {
    const listings = usePaidListings();
    const apiRef = useGridApiRef();

    const columns: GridColDef[] = [
        {
            field: 'market',
            headerName: 'Market / Scid',
            width: 150,
            editable: false,
            renderCell: (params) => <MarketScid listing={params.row} />,
        },
        {
            field: 'contract',
            headerName: 'Description',
            flex: 4,
            minWidth: 200,
            renderCell: (params) => <DescriptionCell listing={params.row} />,
        },
        {
            field: 'verified',
            headerName: 'Verified',
            headerAlign: 'center',
            align: 'center',
            width: 80,
            renderCell: (params) => <Verified value={params.value} />,
        },
        {
            field: 'x1',
            headerName: 'Party A',
            headerAlign: 'center',
            align: 'center',
            width: 100,
            flex: 1,
            renderCell: (params) => <PartyDisplay address={params.row.contract?.firstPartyWallet?.address} />,
        },
        {
            field: 'partyA_requiredGuaranteeTotal',
            headerName: 'Guarantee A',
            headerAlign: 'center',
            align: 'center',
            flex: 1,
            renderCell: (params) => (params.value != null ? <DeroAmount value={params.value} preferUsd /> : ''),
        },
        {
            field: 'partyA_requiredPaymentsTotal',
            headerName: 'Payments A',
            headerAlign: 'center',
            align: 'center',
            flex: 1,
            renderCell: (params) => (params.value != null ? <DeroAmount value={params.value} preferUsd /> : ''),
        },
        {
            field: 'partyB_requiredGuaranteeTotal',
            headerName: 'Guarantee B',
            headerAlign: 'center',
            align: 'center',
            flex: 1,
            renderCell: (params) => (params.value != null ? <DeroAmount value={params.value} preferUsd /> : ''),
        },
        {
            field: 'partyB_requiredPaymentsTotal',
            headerName: 'Payments B',
            headerAlign: 'center',
            align: 'center',
            flex: 1,
            renderCell: (params) => (params.value != null ? <DeroAmount value={params.value} preferUsd /> : ''),
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: '',
            align: 'right',
            width: 40,
            getActions: ({ row }) => {
                const returnedActions: ReactElement<GridActionsCellItemProps, string | JSXElementConstructor<any>>[] = [];

                returnedActions.push(<GridActionsCellItem icon={<FileOpenIcon />} label="Open" onClick={handleOpenGuaranteeClick(row.scid)} />);
                return returnedActions;
            },
        },
    ];

    const handleOpenGuaranteeClick = (scid: string) => async (event: React.MouseEvent) => {
        event.stopPropagation();

        setCurrentTab('Guarantee');
        loadContractAndSet(scid, true);
    };

    return (
        <Container>
            <DataGrid
                sx={{
                    '& .MuiDataGrid-row': {
                        height: '4.5rem',
                    },
                }}
                apiRef={apiRef}
                rows={listings}
                columns={columns}
                getRowId={(row) => row.listingKey}
                disableRowSelectionOnClick
                hideFooterPagination
                onProcessRowUpdateError={(error) => console.error('processRowUpdateWallet', error)}
                getRowHeight={() => 'auto'}
            />
        </Container>
    );
};

export default MainListingsTable;
