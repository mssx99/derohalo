import React from 'react';
import { useSelector } from 'react-redux';
import store, { RootState } from 'store';

export const useDirectoryWallets = () => {
    const wallets = useSelector((state: RootState) => state.directoryState.entriesWallet);
    return wallets;
};

export const useDirectorySmartContracts = (filterType?: SmartContractType | null) => {
    const smartContracts = useSelector((state: RootState) => state.directoryState.entriesSmartContract);
    if (filterType) {
        return smartContracts.filter((sc) => sc.type === filterType);
    }
    return smartContracts;
};

export const useDirectoryTransactions = () => {
    const transactions = useSelector((state: RootState) => state.directoryState.entriesAtomic);
    return transactions;
};
