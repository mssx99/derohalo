import { IS_DEBUG } from 'Constants';
import { useEffect } from 'react';
import { openDB, deleteDB, IDBPDatabase, IDBPObjectStore, DBSchema } from 'idb';

import store from 'store';
import { DatabaseNotPreparedError } from 'customErrors';
import { directoryStateActions } from 'store/reducers/directoryStateReducer';
import { updateSmartContracts, updateWallets } from 'helpers/DirectoryHelper';

const DATABASE_NAME = 'DeroDatabase';

const initialDataRead = async () => {};

const WALLET_OBJECTSTORE = 'wallets';
const SMARTCONTRACT_OBJECTSTORE = 'smartContracts';

interface DeroDatabase extends DBSchema {
    wallets: { key: string; value: IWalletDirectoryEntry };
    smartContracts: { key: string; value: ISmartContractDirectoryEntry };
}

let db: IDBPDatabase<DeroDatabase> | null = null;

export const useIndexedDb = () => {
    useEffect(() => {
        let active = true;
        const loadDB = async () => {
            if (IS_DEBUG) {
                //await deleteDB(DATABASE_NAME);
            }
            db = await openDB<DeroDatabase>(DATABASE_NAME, 1, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    let walletStore = db.createObjectStore(WALLET_OBJECTSTORE, { keyPath: 'address' });
                    let smartContractStore = db.createObjectStore(SMARTCONTRACT_OBJECTSTORE, { keyPath: 'scid' });
                },
            });

            if (process.env.REACT_APP_WEB_SC) {
                DeroDB_insertOrUpdateSmartContract({ scid: process.env.REACT_APP_WEB_SC, type: 'WEB', description: 'Web-Example', isSaved: true });
            }

            if (IS_DEBUG) {
                const walletStore = db.transaction(WALLET_OBJECTSTORE, 'readwrite').objectStore(WALLET_OBJECTSTORE);

                if ((await walletStore.count()) == 0) {
                    DeroDB_insertOrUpdateWallet({ address: process.env.REACT_APP_ADDRESS_CAROLINE!, alias: 'Caroline', isSaved: true, flags: [] });
                    DeroDB_insertOrUpdateWallet({ address: process.env.REACT_APP_ADDRESS_CHILD1!, alias: 'Child1', isSaved: true, flags: [] });
                    DeroDB_insertOrUpdateWallet({ address: process.env.REACT_APP_ADDRESS_CHILD2!, alias: 'Child2', isSaved: true, flags: [] });
                    DeroDB_insertOrUpdateWallet({ address: process.env.REACT_APP_ADDRESS_JOHNNY!, alias: 'Johnny', isSaved: true, flags: [] });

                    if (process.env.REACT_APP_MULTISIG_SC) {
                        DeroDB_insertOrUpdateSmartContract({ scid: process.env.REACT_APP_MULTISIG_SC, type: 'MULTISIGNATURE', description: 'MultiSignature-Example', isSaved: true });
                    }
                    if (process.env.REACT_APP_GUARANTEE_SC) {
                        DeroDB_insertOrUpdateSmartContract({ scid: process.env.REACT_APP_GUARANTEE_SC, type: 'GUARANTEE', description: 'Guarantee-Example', isSaved: true });
                    }
                }
            }
        };

        loadDB().then(async () => {
            if (!active) return;
            updateWallets();
            updateSmartContracts();
        });

        return () => {
            active = false;
        };
    }, []);
};

export const DeroDB_getAllWallets = async () => {
    if (!db) throw new DatabaseNotPreparedError();
    const walletStore = db.transaction(WALLET_OBJECTSTORE, 'readwrite').objectStore(WALLET_OBJECTSTORE);
    return await walletStore.getAll();
};

export const DeroDB_insertOrUpdateWallet = async (walletDirectoryEntry: IWalletDirectoryEntry) => {
    if (!db) throw new DatabaseNotPreparedError();
    const walletStore = db.transaction(WALLET_OBJECTSTORE, 'readwrite').objectStore(WALLET_OBJECTSTORE);
    await walletStore.put(walletDirectoryEntry);
};

export const DeroDB_deleteWallet = async (address: string) => {
    if (!db) throw new DatabaseNotPreparedError();
    const walletStore = db.transaction(WALLET_OBJECTSTORE, 'readwrite').objectStore(WALLET_OBJECTSTORE);
    await walletStore.delete(address);
};

export const DeroDB_getAllSmartContracts = async () => {
    if (!db) throw new DatabaseNotPreparedError();
    const smartContractStore = db.transaction(SMARTCONTRACT_OBJECTSTORE, 'readwrite').objectStore(SMARTCONTRACT_OBJECTSTORE);
    return await smartContractStore.getAll();
};

export const DeroDB_insertOrUpdateSmartContract = async (smartContractDirectoryEntry: ISmartContractDirectoryEntry) => {
    if (!db) throw new DatabaseNotPreparedError();
    const smartContractStore = db.transaction(SMARTCONTRACT_OBJECTSTORE, 'readwrite').objectStore(SMARTCONTRACT_OBJECTSTORE);
    await smartContractStore.put(smartContractDirectoryEntry);
};

export const DeroDB_deleteSmartContract = async (scid: string) => {
    if (!db) throw new DatabaseNotPreparedError();
    const smartContractStore = db.transaction(SMARTCONTRACT_OBJECTSTORE, 'readwrite').objectStore(SMARTCONTRACT_OBJECTSTORE);
    await smartContractStore.delete(scid);
};
