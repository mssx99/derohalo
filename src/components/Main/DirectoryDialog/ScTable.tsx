import React, { ReactElement, JSXElementConstructor, useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
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

import { useDirectorySmartContracts } from 'hooks/directoryHooks';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { isDeroAddress, isSmartContractId } from 'helpers/DeroHelper';

import { nanoid } from 'nanoid';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { deleteEntrySmartContract, insertOrUpdateEntrySmartContract, updateSmartContracts } from 'helpers/DirectoryHelper';
import { DeroDB_deleteSmartContract, DeroDB_insertOrUpdateSmartContract } from 'browserStorage/indexedDb';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';
import FileUploadButton from 'components/common/FileUploadButton';
import FileDownloadButton from 'components/common/FileDownloadButton';
import ScidSelectorEnter from './ScidSelectorEnter';

interface ISmartContractTable {
    height?: number | string;
    width?: number | string;
}

interface IEditableSmartContractDirectoryEntry extends ISmartContractDirectoryEntry {
    id: string;
    original: ISmartContractDirectoryEntry | null;
}

interface IExportSmartContract {
    scid: Hash;
    type: SmartContractType | null;
    description?: string;
}

const mergeArrays = (existingData: GridRowsProp<IEditableSmartContractDirectoryEntry>, newData: ISmartContractDirectoryEntry[]) => {
    newData = [...newData];
    const newRows = existingData
        .reduce((acc, exObj) => {
            const index = newData.findIndex((nObj) => nObj.scid === exObj.scid);

            if (index > -1) {
                acc.push({ id: exObj.id, ...newData[index], original: newData[index] });
                newData.splice(index, 1);
            } else {
                acc.push(exObj);
            }

            return acc;
        }, [] as IEditableSmartContractDirectoryEntry[])
        .concat(newData.map((we) => ({ id: nanoid(), ...we, original: we } as IEditableSmartContractDirectoryEntry)));
    const result: GridRowsProp<IEditableSmartContractDirectoryEntry> = [...newRows];
    return result;
};

const isEdited = (editableEntry: IEditableSmartContractDirectoryEntry): boolean => {
    const originalEntry = editableEntry.original;

    if (originalEntry === null) return true;
    if (!editableEntry.isSaved) {
        return true;
    }

    const allKeys: (keyof ISmartContractDirectoryEntry)[] = ['type', 'isSaved', 'scid', 'description'];

    return !allKeys.every((key) => {
        const originalValue = originalEntry[key];
        const editableValue = editableEntry[key];

        if (editableValue === undefined && originalValue === undefined) {
            return true;
        }

        return JSON.stringify(editableValue) === JSON.stringify(originalValue);
    });
};

const otherRowHasScid = (smartContracts: GridRowsProp<IEditableSmartContractDirectoryEntry>, newRowId: string, scid: Hash) => {
    const otherRowHasIt = smartContracts.some((w) => w.id !== newRowId && w.scid === scid);
    return otherRowHasIt;
};

const isRowValid = (row: IEditableSmartContractDirectoryEntry): boolean => {
    if (!isSmartContractId(row.scid)) {
        return false;
    }
    if (!row.type) {
        return false;
    }

    return true;
};

const convertEditableToNormal = (editable: IEditableSmartContractDirectoryEntry) => {
    return { type: editable.type, scid: editable.scid, description: editable.description, isSaved: editable.isSaved } as ISmartContractDirectoryEntry;
};

const convertEditableToExport = (editable: IEditableSmartContractDirectoryEntry) => {
    return { type: editable.type, scid: editable.scid, description: editable.description } as IExportSmartContract;
};

const ScTable: React.FC<ISmartContractTable> = ({ width = '100%', height = 400 }) => {
    const apiRef = useGridApiRef();
    const smartContracts = useDirectorySmartContracts();

    const [displayedSmartContracts, setDisplayedSmartContracts] = useState<GridRowsProp<IEditableSmartContractDirectoryEntry>>([]);
    const displayedSmartContractsRef = useRef<GridRowsProp<IEditableSmartContractDirectoryEntry>>([]);

    useEffect(() => {
        displayedSmartContractsRef.current = displayedSmartContracts;
    }, [displayedSmartContracts]);

    useEffect(() => {
        setDisplayedSmartContracts(mergeArrays(displayedSmartContractsRef.current, smartContracts));
    }, [smartContracts]);

    const handleSaveClick = (id: GridRowId) => async (event: React.MouseEvent) => {
        event.stopPropagation();
        const savedRow = displayedSmartContracts.find((d) => d.id === id);
        if (savedRow && isSmartContractId(savedRow.scid)) {
            const normal = convertEditableToNormal(savedRow);
            normal.isSaved = true;
            insertOrUpdateEntrySmartContract(normal);
            await DeroDB_insertOrUpdateSmartContract(normal);
        }
    };

    const handleDeleteClick = (id: GridRowId) => async (event: React.MouseEvent) => {
        event.stopPropagation();
        const deletedRow = displayedSmartContracts.find((d) => d.id === id);
        if (deletedRow && isSmartContractId(deletedRow.scid)) {
            deleteEntrySmartContract(deletedRow.scid);
            await DeroDB_deleteSmartContract(deletedRow.scid);
        }

        const newData = displayedSmartContracts.filter((d) => d.id !== id);
        setDisplayedSmartContracts(newData);
        updateSmartContracts();
    };

    const handleProcessRowUpdate = useCallback((newRow: IEditableSmartContractDirectoryEntry) => {
        newRow.scid = newRow.scid ? newRow.scid.trim() : '';
        if (otherRowHasScid(displayedSmartContractsRef.current, newRow.id, newRow.scid)) {
            newRow.scid = '';
            addSnackbar({ message: `This scid already exists, please update the other entry.`, severity: MESSAGE_SEVERITY.ERROR });
        }
        setDisplayedSmartContracts((prevRows) => {
            return prevRows.map((row) => (row.id === newRow.id ? newRow : row));
        });
        return newRow;
    }, []);

    const handleAddSmartContract = useCallback(() => {
        const newDisplayedSmartContracts: GridRowsProp<IEditableSmartContractDirectoryEntry> = [
            ...displayedSmartContracts,
            { id: nanoid(), scid: '', type: 'MULTISIGNATURE', isSaved: false, original: null } as IEditableSmartContractDirectoryEntry,
        ];
        setDisplayedSmartContracts(newDisplayedSmartContracts);
        if (apiRef.current) {
            setTimeout(() => {
                apiRef.current.scrollToIndexes({
                    rowIndex: newDisplayedSmartContracts.length - 1,
                });
            });
        }
    }, [displayedSmartContracts, apiRef]);

    const columns: GridColDef[] = [
        {
            field: 'type',
            headerName: 'Type',
            width: 150,
            editable: true,
            type: 'singleSelect',
            valueOptions: [
                { value: 'MULTISIGNATURE', label: 'MultiSignature' },
                { value: 'GUARANTEE', label: 'Guarantee' },
                { value: 'WEB', label: 'Web' },
            ],
        },
        {
            field: 'scid',
            headerName: 'SmartContract-Id',
            width: 510,
            editable: true,
            renderCell: (params) =>
                isSmartContractId(params.value) ? (
                    <div>{params.value}</div>
                ) : (
                    <Tooltip title={'SmartContractId is not valid' + params.value} followCursor>
                        <div>{params.value}</div>
                    </Tooltip>
                ),
            renderEditCell: (params: GridRenderEditCellParams) => {
                const handleEnter = (value: string | null) => {
                    params.api.setEditCellValue({ id: params.id, field: params.field, value });
                };

                const type = params.api.getCellValue(params.id, 'type');

                return <ScidSelectorEnter value={params.value || ''} onEnter={handleEnter} type={type} />;
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
                importSmartContracts(obj as ISmartContractDirectoryEntry[]);
            }
        };
        reader.readAsText(file);
    };

    const importSmartContracts = async (importedSmartContracts: IExportSmartContract[]) => {
        const newWallets: ISmartContractDirectoryEntry[] = [];

        for (const iw of importedSmartContracts) {
            const normal = { ...iw, isSaved: true } as ISmartContractDirectoryEntry;

            await DeroDB_insertOrUpdateSmartContract(normal);
        }

        updateSmartContracts();
    };

    const createExportData = () => {
        return JSON.stringify(displayedSmartContractsRef.current?.map((x) => convertEditableToExport(x)));
    };

    const CustomFooter = () => {
        return (
            <GridToolbarContainer sx={{ justifyContent: 'space-between' }}>
                <div>
                    <Button variant="text" onClick={handleAddSmartContract}>
                        Add New SmartContract
                    </Button>
                </div>
                <Stack direction="row" spacing={1}>
                    <FileUploadButton text="Import" variant="text" accept="application/json" onFileSelect={handleFileSelect} />
                    <FileDownloadButton text="Export" variant="text" mimeType="application/json" createData={createExportData} filename="SmartContractDownload.json" />
                </Stack>
            </GridToolbarContainer>
        );
    };

    return (
        <Paper sx={{ height, maxWidth: width, overflow: 'auto' }}>
            <DataGrid
                apiRef={apiRef}
                rows={displayedSmartContracts}
                columns={columns}
                disableRowSelectionOnClick
                hideFooterPagination
                processRowUpdate={handleProcessRowUpdate}
                onProcessRowUpdateError={(error) => console.error('processRowUpdateSmartContract', error)}
                getRowHeight={() => 'auto'}
                getRowClassName={(params) => (!isRowValid(params.row as IEditableSmartContractDirectoryEntry) ? 'row-error' : '')}
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

export default ScTable;
