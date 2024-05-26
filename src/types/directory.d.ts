type WalletDirectoryEntryType = 'INVOLVED_MULTISIGNATURE' | 'INVOLVED_GUARANTEE' | 'CHAT';

interface IWalletDirectoryEntry {
    flags: WalletDirectoryEntryType[];
    isSaved: boolean;
    address: string;
    alias?: string;
    description?: string;
}

interface ISmartContractDirectoryEntry {
    scid: Hash;
    type: SmartContractType | null;
    isSaved: boolean;
    description?: string;
}
