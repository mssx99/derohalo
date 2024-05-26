import {
    DeroDB_deleteSmartContract,
    DeroDB_deleteWallet,
    DeroDB_getAllSmartContracts,
    DeroDB_getAllWallets,
    DeroDB_insertOrUpdateSmartContract,
    DeroDB_insertOrUpdateWallet,
} from 'browserStorage/indexedDb';
import { DatabaseNotPreparedError } from 'customErrors';
import store from 'store';
import { directoryStateActions } from 'store/reducers/directoryStateReducer';

export const getDummySmartContractDirectoryEntry = (
    value: ISmartContractDirectoryEntry | string | null,
    type: SmartContractType = 'MULTISIGNATURE',
    isSaved: boolean = false
): ISmartContractDirectoryEntry | null => {
    if (value == null) return null;
    if (typeof value === 'object') {
        return value;
    }
    return { scid: value, type, isSaved };
};

const convertWalletToWalletEntry = (wallet: IWallet) => {
    return { address: wallet.address, alias: wallet.alias, flags: [], isSaved: false } as IWalletDirectoryEntry;
};

export const getAllWalletEntries = async () => {
    let entries: IWalletDirectoryEntry[];
    try {
        entries = await DeroDB_getAllWallets();
    } catch (e) {
        if (e instanceof DatabaseNotPreparedError) {
            console.error('Could not load Database Wallet entries as the Database is in a not prepared state.');
            entries = [];
        }
        throw e;
    }

    const addFlag = (value: IWalletDirectoryEntry | string, flag: WalletDirectoryEntryType) => {
        value = typeof value === 'object' ? value : { address: value, flags: [flag], isSaved: false };
        let obj = entries.find((w) => w.address === (value as IWalletDirectoryEntry).address);

        if (obj) {
            const combinedFlags = [...new Set([...obj.flags, ...value.flags])];
            obj = { ...obj, ...value, flags: combinedFlags, isSaved: obj.isSaved };
        } else {
            obj = { ...value };
        }

        if (!obj.flags.includes(flag)) {
            const flags = [...obj.flags, flag] as WalletDirectoryEntryType[];
            insertOrUpdateEntryWallet({ ...obj, flags });
        }

        let index = entries.findIndex((entry) => entry.address === obj!.address);

        if (index > -1) {
            entries.splice(index, 1, obj);
        } else {
            entries.push(obj);
        }
    };

    const multiSigContract = store.getState().multiSigState.contract as IMultiSigContract;

    if (multiSigContract) {
        multiSigContract.involvedParties.forEach((ip) => {
            if (ip.address) {
                addFlag(convertWalletToWalletEntry(ip), 'INVOLVED_MULTISIGNATURE');
            }
        });
    }

    const guaranteeContract = store.getState().guaranteeState.contract as IGuaranteeContract;

    if (guaranteeContract) {
        if (guaranteeContract.firstPartyWallet?.address) {
            addFlag(convertWalletToWalletEntry(guaranteeContract.firstPartyWallet), 'INVOLVED_GUARANTEE');
        }
        if (guaranteeContract.secondPartyWallet?.address) {
            addFlag(convertWalletToWalletEntry(guaranteeContract.secondPartyWallet), 'INVOLVED_GUARANTEE');
        }
    }

    store.getState().chatState.chats.forEach((chat) => {
        if (!chat.otherParty) return;
        const foundEntry = entries.find((we) => we.address === chat.otherParty!.address);
        if (foundEntry) {
            addFlag(chat.otherParty.address, 'CHAT');
        } else {
            addFlag({ ...chat.otherParty, isSaved: false }, 'CHAT');
        }
    });

    return entries;
};

export const getAllSmartContractEntries = async () => {
    let entries: ISmartContractDirectoryEntry[];
    try {
        entries = await DeroDB_getAllSmartContracts();
    } catch (e) {
        if (e instanceof DatabaseNotPreparedError) {
            console.error('Could not load Database SmartContract entries as the Database is in a not prepared state.');
            entries = [];
        }
        throw e;
    }

    const multiSigContract = store.getState().multiSigState.contract;
    const multiSigScid = multiSigContract?.scid;

    if (multiSigScid) {
        const foundMultiSig = entries.find((entry) => entry.scid === multiSigScid);
        if (!foundMultiSig) {
            entries.push(getDummySmartContractDirectoryEntry(multiSigScid, 'MULTISIGNATURE')!);
        }
    }

    const guaranteeContract = store.getState().guaranteeState.contract;
    const guaranteeScid = guaranteeContract?.scid;

    if (guaranteeScid) {
        const foundGuarantee = entries.find((entry) => entry.scid === guaranteeScid);
        if (!foundGuarantee) {
            entries.push(getDummySmartContractDirectoryEntry(guaranteeScid, 'GUARANTEE')!);
        }
    }

    const webContract = store.getState().webState.contract;
    const webScid = webContract?.scid;

    if (webScid) {
        const foundWeb = entries.find((entry) => entry.scid === webScid);
        if (!foundWeb) {
            entries.push(getDummySmartContractDirectoryEntry(webScid, 'WEB')!);
        }
    }

    return entries;
};

export const insertOrUpdateWalletToFavorites = async (value: IWalletDirectoryEntry | string) => {
    if (typeof value === 'object') {
        value = { ...value, isSaved: true };
        await DeroDB_insertOrUpdateWallet(value);
    } else {
        await DeroDB_insertOrUpdateWallet({ address: value, flags: [], isSaved: true });
    }

    await updateWallets();
};

export const deleteWalletFromFavorites = async (address: string) => {
    await DeroDB_deleteWallet(address);

    await updateWallets();
};

export const insertOrUpdateSmartContractToFavorites = async (value: ISmartContractDirectoryEntry | string, smartContractType: SmartContractType) => {
    if (typeof value === 'object') {
        value = { ...value, isSaved: true };
        await DeroDB_insertOrUpdateSmartContract(value);
    } else {
        await DeroDB_insertOrUpdateSmartContract(getDummySmartContractDirectoryEntry(value, smartContractType, true)!);
    }

    await updateSmartContracts();
};

export const deleteSmartContractFromFavorites = async (scid: Hash) => {
    await DeroDB_deleteSmartContract(scid);

    await updateSmartContracts();
};

export const updateWallets = async () => {
    const newEntries = await getAllWalletEntries();
    store.dispatch(directoryStateActions.setEntriesWallet(newEntries));
};

export const setEntriesWallet = (newEntries: IWalletDirectoryEntry[]) => {
    store.dispatch(directoryStateActions.setEntriesWallet(newEntries));
};

export const insertOrUpdateEntryWallet = (newEntry: IWalletDirectoryEntry) => {
    store.dispatch(directoryStateActions.insertOrUpdateEntryWallet(newEntry));
};

export const deleteEntryWallet = async (address: Hash) => {
    store.dispatch(directoryStateActions.deleteEntryWallet(address));
};

export const updateSmartContracts = async () => {
    const newEntries = await getAllSmartContractEntries();
    store.dispatch(directoryStateActions.setEntriesSmartContract(newEntries));
};

export const insertOrUpdateEntrySmartContract = (newEntry: ISmartContractDirectoryEntry) => {
    store.dispatch(directoryStateActions.insertOrUpdateEntrySmartContract(newEntry));
};

export const deleteEntrySmartContract = async (scid: Hash) => {
    store.dispatch(directoryStateActions.deleteEntrySmartContract(scid));
};

export const isWalletDirectoryEntry = (obj: any): obj is IWalletDirectoryEntry => {
    return (
        obj != null &&
        Array.isArray(obj.flags) &&
        obj.flags.every((flag: WalletDirectoryEntryType) => ['INVOLVED_MULTISIGNATURE', 'INVOLVED_GUARANTEE', 'CHAT'].includes(flag)) &&
        typeof obj.isSaved === 'boolean' &&
        typeof obj.address === 'string' &&
        (typeof obj.alias === 'string' || typeof obj.alias === 'undefined' || obj.alias == null) &&
        (typeof obj.description === 'string' || typeof obj.description === 'undefined')
    );
};

export const isSmartContractDirectoryEntry = (obj: any): obj is ISmartContractDirectoryEntry => {
    return (
        obj != null &&
        typeof obj.scid === 'string' &&
        (obj.type === null || ['MULTISIGNATURE', 'GUARANTEE', 'WEB'].includes(obj.type)) &&
        typeof obj.isSaved === 'boolean' &&
        (typeof obj.description === 'string' || typeof obj.description === 'undefined')
    );
};

const NOT_AVAILABLE = 'N/A';

export const getNameForDeroAddress = (address: string | null) => {
    if (!address) return NOT_AVAILABLE;
    return store.getState().directoryState.entriesWallet.find((w) => w.address === address)?.alias ?? NOT_AVAILABLE;
};

export const getExistingWalletDirectoryEntry = (address: string) => {
    return store.getState().directoryState.entriesWallet.find((w) => w.address === address) ?? null;
};
