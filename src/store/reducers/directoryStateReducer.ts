import { createAction, createReducer, current } from '@reduxjs/toolkit';
import { updateOnlyChangedProperties } from 'helpers/Helper';
import { nanoid } from 'nanoid';
import _ from 'underscore';

interface DirectoryState {
    sortWallet: ISortType;
    sortSmartContract: ISortType;
    sortAtomic: ISortType;
    entriesWallet: IWalletDirectoryEntry[];
    entriesSmartContract: ISmartContractDirectoryEntry[];
    entriesAtomic: IAtomicTransaction[];
}

const initialState: DirectoryState = {
    sortWallet: { field: 'alias', asc: true },
    sortSmartContract: { field: 'description', asc: true },
    sortAtomic: { field: 'atomicId', asc: true },
    entriesWallet: [],
    entriesSmartContract: [],
    entriesAtomic: [],
};

export const directoryStateActions = {
    setSortWallet: createAction<ISortType>('directoryStateActions/setSortWallet'),
    setSortSmartContract: createAction<ISortType>('directoryStateActions/setSortSmartContract'),
    setSortAtomic: createAction<ISortType>('directoryStateActions/setSortAtomic'),
    insertOrUpdateEntryWallet: createAction<IWalletDirectoryEntry>('directoryStateActions/updateEntryWallet'),
    deleteEntryWallet: createAction<Hash>('directoryStateActions/deleteEntryWallet'),
    setEntriesWallet: createAction<IWalletDirectoryEntry[]>('directoryStateActions/setEntriesWallet'),
    insertOrUpdateEntrySmartContract: createAction<ISmartContractDirectoryEntry>('directoryStateActions/updateEntrySmartContract'),
    deleteEntrySmartContract: createAction<Hash>('directoryStateActions/deleteEntrySmartContract'),
    setEntriesSmartContract: createAction<ISmartContractDirectoryEntry[]>('directoryStateActions/setEntriesSmartContract'),
    addEntryAtomic: createAction<IAtomicTransaction>('directoryStateActions/addEntryAtomic'),
    updateEntryAtomic: createAction<IAtomicTransaction>('directoryStateActions/updateEntryAtomic'),
    setEntriesAtomic: createAction<IAtomicTransaction[]>('directoryStateActions/setEntriesAtomic'),
};

export const directoryStateReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(directoryStateActions.setSortWallet, (state, action) => {
            const sortType = action.payload;
            state.sortWallet = sortType;
            sort(state.entriesWallet, state.sortWallet);
        })
        .addCase(directoryStateActions.setSortSmartContract, (state, action) => {
            const sortType = action.payload;
            state.sortSmartContract = sortType;
            sort(state.entriesSmartContract, state.sortSmartContract);
        })
        .addCase(directoryStateActions.setSortAtomic, (state, action) => {
            const sortType = action.payload;
            state.sortAtomic = sortType;
            sort(state.entriesAtomic, state.sortAtomic);
        })

        .addCase(directoryStateActions.insertOrUpdateEntryWallet, (state, action) => {
            const updatedEntry = action.payload;
            if (state.entriesWallet.some((ew) => ew.address === updatedEntry.address)) {
                state.entriesWallet = state.entriesWallet.map((ew) => {
                    if (ew.address === updatedEntry.address) return updatedEntry;
                    return ew;
                });
            } else {
                state.entriesWallet.push(updatedEntry);
            }
            sort(state.entriesWallet, state.sortWallet);
        })
        .addCase(directoryStateActions.deleteEntryWallet, (state, action) => {
            const deletedEntryScid = action.payload;
            state.entriesWallet = state.entriesWallet.filter((ew) => ew.address !== deletedEntryScid);
        })
        .addCase(directoryStateActions.setEntriesWallet, (state, action) => {
            const newEntries = action.payload;
            state.entriesWallet = newEntries;
            sort(state.entriesWallet, state.sortWallet);
        })
        .addCase(directoryStateActions.insertOrUpdateEntrySmartContract, (state, action) => {
            const updatedEntry = action.payload;
            if (state.entriesSmartContract.some((ew) => ew.scid === updatedEntry.scid)) {
                state.entriesSmartContract = state.entriesSmartContract.map((ew) => {
                    if (ew.scid === updatedEntry.scid) return updatedEntry;
                    return ew;
                });
            } else {
                state.entriesSmartContract.push(updatedEntry);
            }
            sort(state.entriesSmartContract, state.sortSmartContract);
        })
        .addCase(directoryStateActions.deleteEntrySmartContract, (state, action) => {
            const deletedEntryScid = action.payload;
            state.entriesSmartContract = state.entriesSmartContract.filter((es) => es.scid !== deletedEntryScid);
        })
        .addCase(directoryStateActions.setEntriesSmartContract, (state, action) => {
            const newEntries = action.payload;
            state.entriesSmartContract = newEntries;
        })
        .addCase(directoryStateActions.addEntryAtomic, (state, action) => {
            const newEntry = action.payload;
            state.entriesAtomic.push(newEntry);
            sort(state.entriesAtomic, state.sortAtomic);
        })
        .addCase(directoryStateActions.updateEntryAtomic, (state, action) => {
            const updatedEntry = action.payload;
            state.entriesAtomic = state.entriesAtomic.map((ea) => {
                if (ea.txid === updatedEntry.txid) return updatedEntry;
                return ea;
            });
            sort(state.entriesAtomic, state.sortAtomic);
        })
        .addCase(directoryStateActions.setEntriesAtomic, (state, action) => {
            const newEntries = action.payload;
            state.entriesAtomic = newEntries;
            sort(state.entriesAtomic, state.sortAtomic);
        });
});

interface ISortType {
    field: string;
    asc: boolean;
}

const getSortFunction = (sortType: ISortType) => {
    return (a: any, b: any) => {
        a = a[sortType.field];
        b = b[sortType.field];

        let returnValue = 0;
        if (typeof a === 'string') {
            a = a as string;
            b = b as string;
            returnValue = a.localeCompare(b);
        }

        if (typeof b === 'number') {
            if (a < b) {
                returnValue = -1;
            }
            if (a === b) {
                returnValue = 0;
            }
            if (a > b) {
                returnValue = 1;
            }
        }

        return sortType.asc ? returnValue : -returnValue;
    };
};

const sort = (array: any[], sortType: ISortType) => {
    const sortFunction = getSortFunction(sortType);
    array.sort(sortFunction);
};
