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
import Verified from 'components/Listings/Verified';
import DescriptionCell from 'components/Listings/DescriptionCell';
import MarketScid from 'components/Listings/MarketScid';
import { setBusyBackdrop, setCurrentTab } from 'hooks/mainHooks';
import { updateWalletBalance, useWalletAddress } from 'hooks/deroHooks';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import { approveListing, returnMoneyAndRemove } from 'helpers/Web/WebContractHelper';
import { updateWebContract, useContract } from 'hooks/webHooks';
import { CachedLoader } from 'components/Listings/CachedLoader';
import ChatIcon from '@mui/icons-material/Chat';
import { getExistingWalletDirectoryEntry } from 'helpers/DirectoryHelper';
import { goToChat } from 'helpers/ChatHelper';
import { loadContractAndSet } from 'helpers/Guarantee/GuaranteeSmartContractHelper';

interface IPendingApprovalsTable {
    listings: IListing[];
    height?: number | string;
    width?: number | string;
}

const PendingApprovalsTable: React.FC<IPendingApprovalsTable> = ({ listings, width = '100%', height = 400 }) => {
    const apiRef = useGridApiRef();
    const webContract = useContract();
    const walletAddress = useWalletAddress();

    const columns: GridColDef[] = [
        {
            field: 'verified',
            headerName: 'Verified',
            headerAlign: 'center',
            align: 'center',
            width: 80,
            renderCell: (params) => <Verified value={params.value} />,
        },
        {
            field: 'market',
            headerName: 'Market / Scid',
            width: 150,
            renderCell: (params) => <MarketScid listing={params.row} />,
        },
        {
            field: 'paid',
            headerName: 'Paid',
            width: 180,
            renderCell: (params) => <DeroAmount value={params.value} />,
        },
        {
            field: 'paidUntilBlock',
            headerName: 'Paid Until Block',
            headerAlign: 'center',
            align: 'center',
            width: 150,
            renderCell: (params) => formatNumber(params.value, 0, 0),
        },
        {
            field: 'contract',
            headerName: 'Description',
            minWidth: 200,
            flex: 1,
            renderCell: (params) => <DescriptionCell listing={params.row} />,
        },
        {
            field: 'actions',
            type: 'actions',
            align: 'right',
            width: 160,
            cellClassName: 'actions',
            getActions: ({ id, row }) => {
                const returnedActions: ReactElement<GridActionsCellItemProps, string | JSXElementConstructor<any>>[] = [];

                returnedActions.push(<GridActionsCellItem icon={<ThumbUpIcon />} label="Approve" onClick={handleApproveClick(id)} color="primary" />);
                returnedActions.push(<GridActionsCellItem icon={<ThumbDownAltIcon />} label="Reject" onClick={handleRejectClick(id)} color="error" />);
                returnedActions.push(<GridActionsCellItem icon={<FileOpenIcon />} label="Open" onClick={handleOpenGuaranteeClick(id)} />);

                if (row?.contract?.ownerAddress && row.contract.ownerAddress !== walletAddress) {
                }
                returnedActions.push(<GridActionsCellItem icon={<ChatIcon />} label="Open" onClick={handleChatClick(id)} />);
                return returnedActions;
            },
        },
    ];

    const handleApproveClick = (id: GridRowId) => async (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!webContract?.scid) return;

        const listingKey = id as string;

        setBusyBackdrop(true, 'Approving Listing...');
        try {
            const txid = await approveListing(webContract.scid, listingKey);
            await updateWalletBalance();
            CachedLoader.removeListingFromAlreadyProcessed(listingKey);
            updateWebContract();
            addSnackbar({ message: 'The listing was approved successfully.', severity: MESSAGE_SEVERITY.SUCCESS });
        } catch (e) {
            console.error(e);
            addSnackbar({ message: 'An error occurred.', severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    };

    const handleRejectClick = (id: GridRowId) => async (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!webContract?.scid) return;

        const listingKey = id as string;

        setBusyBackdrop(true, 'Rejecting Listing...');
        try {
            const txid = await returnMoneyAndRemove(webContract.scid, listingKey);
            await updateWalletBalance();
            CachedLoader.removeListingFromAlreadyProcessed(listingKey);
            updateWebContract();
            addSnackbar({ message: 'The listing was rejected and money returned successfully.', severity: MESSAGE_SEVERITY.SUCCESS });
        } catch (e) {
            console.error(e);
            addSnackbar({ message: 'An error occurred.', severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    };

    const handleOpenGuaranteeClick = (id: GridRowId) => async (event: React.MouseEvent) => {
        event.stopPropagation();

        const row = apiRef.current.getRow(id);

        const scid = row?.contract?.scid;

        if (scid) {
            setCurrentTab('Guarantee');
            loadContractAndSet(scid, true);
        }
    };

    const handleChatClick = (id: GridRowId) => async (event: React.MouseEvent) => {
        event.stopPropagation();

        const row = apiRef.current.getRow(id);

        const address = row?.contract?.ownerAddress;
        if (address && address !== walletAddress) {
            const foundWde = getExistingWalletDirectoryEntry(address);
            goToChat(foundWde ?? address);
        }
    };

    return (
        <Paper sx={{ height, width: width, overflow: 'auto', backgroundColor: '#121212a1;' }}>
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
        </Paper>
    );
};

export default PendingApprovalsTable;
