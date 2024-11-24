import React, { ReactElement, JSXElementConstructor, useRef, useState, useEffect, useCallback } from 'react';

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

import { useDirectoryWallets } from 'hooks/directoryHooks';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { isDeroAddress } from 'helpers/DeroHelper';

import { nanoid } from 'nanoid';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { deleteEntryWallet, insertOrUpdateEntryWallet, updateWallets } from 'helpers/DirectoryHelper';
import { DeroDB_deleteWallet, DeroDB_insertOrUpdateWallet } from 'browserStorage/indexedDb';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import FileUploadButton from 'components/common/FileUploadButton';
import FileDownloadButton from 'components/common/FileDownloadButton';
import WalletAddressSelectorEnter from './WalletAddressSelectorEnter';

interface IWalletTable {
    height?: number | string;
    width?: number | string;
}

interface IEditableWalletDirectoryEntry extends IWalletDirectoryEntry {
    id: string;
    original: IWalletDirectoryEntry | null;
}

interface IExportWallet {
    address: string;
    alias?: string;
    description?: string;
}

const mergeArrays = (existingData: GridRowsProp<IEditableWalletDirectoryEntry>, newData: IWalletDirectoryEntry[]) => {
    newData = [...newData];
    const newRows = existingData
        .reduce((acc, exObj) => {
            const index = newData.findIndex((nObj) => nObj.address === exObj.address);

            if (index > -1) {
                acc.push({ id: exObj.id, ...newData[index], original: newData[index] });
                newData.splice(index, 1);
            } else {
                acc.push(exObj);
            }

            return acc;
        }, [] as IEditableWalletDirectoryEntry[])
        .concat(newData.map((we) => ({ id: nanoid(), ...we, original: we } as IEditableWalletDirectoryEntry)));
    const result: GridRowsProp<IEditableWalletDirectoryEntry> = [...newRows];
    return result;
};

const isEdited = (editableEntry: IEditableWalletDirectoryEntry): boolean => {
    const originalEntry = editableEntry.original;

    if (originalEntry === null) return true;
    if (!editableEntry.isSaved) {
        return true;
    }

    const allKeys: (keyof IWalletDirectoryEntry)[] = ['flags', 'isSaved', 'address', 'alias', 'description'];

    return !allKeys.every((key) => {
        const originalValue = originalEntry[key];
        const editableValue = editableEntry[key];

        if (editableValue === undefined && originalValue === undefined) {
            return true;
        }

        return JSON.stringify(editableValue) === JSON.stringify(originalValue);
    });
};

const otherRowHasAddress = (wallets: GridRowsProp<IEditableWalletDirectoryEntry>, newRowId: string, address: Hash) => {
    const otherRowHasIt = wallets.some((w) => w.id !== newRowId && w.address === address);
    return otherRowHasIt;
};

const isRowValid = (row: IEditableWalletDirectoryEntry): boolean => {
    if (!isDeroAddress(row.address)) {
        return false;
    }

    return true;
};

const convertEditableToNormal = (editable: IEditableWalletDirectoryEntry) => {
    return { alias: editable.alias, address: editable.address, description: editable.description, isSaved: editable.isSaved, flags: editable.flags } as IWalletDirectoryEntry;
};

const convertEditableToExport = (editable: IEditableWalletDirectoryEntry) => {
    return { alias: editable.alias, address: editable.address, description: editable.description } as IExportWallet;
};

const WalletTable: React.FC<IWalletTable> = ({ width = '100%', height = 400 }) => {
    const apiRef = useGridApiRef();
    const wallets = useDirectoryWallets();

    const [displayedWallets, setDisplayedWallets] = useState<GridRowsProp<IEditableWalletDirectoryEntry>>([]);
    const displayedWalletsRef = useRef<GridRowsProp<IEditableWalletDirectoryEntry>>([]);

    useEffect(() => {
        displayedWalletsRef.current = displayedWallets;
    }, [displayedWallets]);

    useEffect(() => {
        setDisplayedWallets(mergeArrays(displayedWalletsRef.current, wallets));
    }, [wallets]);

    const handleSaveClick = (id: GridRowId) => async (event: React.MouseEvent) => {
        event.stopPropagation();
        const savedRow = displayedWallets.find((d) => d.id === id);
        if (savedRow && isDeroAddress(savedRow.address)) {
            const normal = convertEditableToNormal(savedRow);
            normal.isSaved = true;
            insertOrUpdateEntryWallet(normal);
            await DeroDB_insertOrUpdateWallet(normal);
        }
    };

    const handleDeleteClick = (id: GridRowId) => async (event: React.MouseEvent) => {
        event.stopPropagation();
        const deletedRow = displayedWallets.find((d) => d.id === id);
        if (deletedRow && isDeroAddress(deletedRow.address)) {
            deleteEntryWallet(deletedRow.address);
            await DeroDB_deleteWallet(deletedRow.address);
        }

        const newData = displayedWallets.filter((d) => d.id !== id);
        setDisplayedWallets(newData);
        updateWallets();
    };

    const handleProcessRowUpdate = useCallback((newRow: IEditableWalletDirectoryEntry) => {
        newRow.address = newRow.address ? newRow.address.trim() : '';
        if (otherRowHasAddress(displayedWalletsRef.current, newRow.id, newRow.address)) {
            newRow.address = '';
            addSnackbar({ message: `This address already exists, please update the other entry.`, severity: MESSAGE_SEVERITY.ERROR });
        }
        setDisplayedWallets((prevRows) => {
            return prevRows.map((row) => (row.id === newRow.id ? newRow : row));
        });
        return newRow;
    }, []);

    const handleAddWallet = useCallback(() => {
        const newDisplayedWallets: GridRowsProp<IEditableWalletDirectoryEntry> = [
            ...displayedWallets,
            { id: nanoid(), address: '', alias: '', isSaved: false, flags: [], original: null } as IEditableWalletDirectoryEntry,
        ];
        setDisplayedWallets(newDisplayedWallets);
        if (apiRef.current) {
            setTimeout(() => {
                apiRef.current.scrollToIndexes({
                    rowIndex: newDisplayedWallets.length - 1,
                });
            });
        }
    }, [displayedWallets, apiRef]);

    const columns: GridColDef[] = [
        {
            field: 'alias',
            headerName: 'Alias',
            width: 150,
            editable: true,
        },
        {
            field: 'address',
            headerName: 'Address',
            width: 510,
            editable: true,
            renderCell: (params) =>
                isDeroAddress(params.value) ? (
                    <div>{params.value}</div>
                ) : (
                    <Tooltip title={'Address is not valid' + params.value} followCursor>
                        <div>{params.value}</div>
                    </Tooltip>
                ),
            renderEditCell: (params: GridRenderEditCellParams) => {
                const handleEnter = (value: string | null) => {
                    params.api.setEditCellValue({ id: params.id, field: params.field, value });
                };

                return <WalletAddressSelectorEnter value={params.value || ''} onEnter={handleEnter} />;
            },
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1,
            minWidth: 200,
            editable: true,
            renderCell: (params) => <div style={{ whiteSpace: 'normal', lineHeight: 'normal' }}>{params.value}</div>,
            renderEditCell: (params: GridRenderEditCellParams) => (
                <TextField
                    multiline
                    fullWidth
                    value={params.value}
                    onChange={(event) => {
                        params.api.setEditCellValue({ id: params.id, field: params.field, value: event.target.value });
                    }}
                />
            ),
        },
        {
            field: 'flags',
            headerName: 'Flags',
            flex: 0.5,
            minWidth: 100,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            headerAlign: 'right',
            align: 'right',
            width: 80,
            cellClassName: 'actions',
            getActions: ({ id, row }) => {
                const returnedActions: ReactElement<GridActionsCellItemProps, string | JSXElementConstructor<any>>[] = [];

                if (isEdited(row)) {
                    returnedActions.push(<GridActionsCellItem icon={<SaveIcon />} label="Save" onClick={handleSaveClick(id)} color="primary" disabled={!isRowValid(row)} />);
                }
                returnedActions.push(<GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={handleDeleteClick(id)} color="error" />);
                return returnedActions;
            },
        },
    ];

    const handleFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e?.target?.result as string;

            if (text) {
                const obj = JSON.parse(text);
                importWallets(obj as IWalletDirectoryEntry[]);
            }
        };
        reader.readAsText(file);
    };

    const importWallets = useCallback(
        async (importedWallets: IExportWallet[]) => {
            const newWallets: IWalletDirectoryEntry[] = [];

            for (const iw of importedWallets) {
                const normal = { ...iw, isSaved: true, flags: [] } as IWalletDirectoryEntry;

                await DeroDB_insertOrUpdateWallet(normal);
            }

            updateWallets();
        },
        [wallets]
    );

    const createExportData = () => {
        return JSON.stringify(displayedWalletsRef.current?.map((x) => convertEditableToExport(x)));
    };

    const CustomFooter = () => {
        return (
            <GridToolbarContainer sx={{ justifyContent: 'space-between' }}>
                <div>
                    <Button variant="text" onClick={handleAddWallet}>
                        Add New Wallet
                    </Button>
                </div>
                <Stack direction="row" spacing={1}>
                    <FileUploadButton text="Import" variant="text" accept="application/json" onFileSelect={handleFileSelect} />
                    <FileDownloadButton text="Export" variant="text" mimeType="application/json" createData={createExportData} filename="WalletDownload.json" />
                </Stack>
            </GridToolbarContainer>
        );
    };

    return (
        <Paper sx={{ height, maxWidth: width, overflow: 'auto' }}>
            <DataGrid
                apiRef={apiRef}
                rows={displayedWallets}
                columns={columns}
                disableRowSelectionOnClick
                hideFooterPagination
                processRowUpdate={handleProcessRowUpdate}
                onProcessRowUpdateError={(error) => console.error('processRowUpdateWallet', error)}
                getRowHeight={() => 'auto'}
                getRowClassName={(params) => (!isRowValid(params.row as IEditableWalletDirectoryEntry) ? 'row-error' : '')}
                sx={{
                    '& .MuiDataGrid-cell': {
                        paddingTop: '4px',
                        paddingBottom: '4px',
                    },
                    '& .row-error': {
                        backgroundColor: '#4b0000',
                    },
                    '& .MuiDataGrid-row:hover.row-error': {
                        backgroundColor: '#923636',
                    },
                }}
                components={{
                    Footer: CustomFooter,
                }}
            />
        </Paper>
    );
};

export default WalletTable;
