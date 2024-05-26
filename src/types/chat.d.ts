interface IChat {
    otherParty: IWalletDirectoryEntry | null;
    startBlock: Uint64;
    lastBlock: Uint64;
    receivedMaxAmount: Uint64;
    receivedMinAmount: Uint64;
    sentMaxAmount: Uint64;
    sentMinAmount: Uint64;
    totalReceived: Uint64;
    totalSent: Uint64;
    messages: IChatMessage[];
}

interface IChatMessage {
    blockheight_id?: string;
    id: number;
    startTxid?: string;
    tempId?: string;
    blockheight?: number;
    time?: string;
    otherParty: string;
    otherPartyAlias?: string;
    amountSent: Uint64;
    type: string;
    content: string;
    wasReceived: boolean;
    transactions: IChatTransaction[];
    chatPieces: IDeroChatPiece[];
}

interface IChatTransaction {
    txid?: string;
    transactionTempId?: string;
    startPart?: number;
    endPart?: number;
    state: ChatTransactionState;
    stateText?: string;
}

type ChatTransactionState = 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

type MimeTypeValue = 'image/jpeg' | 'image/png' | 'image/webp' | 'auto';

interface IImageOptions {
    retainExif: boolean;
    maxWidth?: number;
    maxHeight?: number;
    mimeType: MimeTypeValue;
    quality: number;
    convertSize: number;
    width?: number;
    height?: number;
    resize?: 'contain' | 'none' | 'cover';
}
