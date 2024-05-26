type ConnectionType = 'bridge' | 'xswd';

interface ILoadContractResult {
    contract: IContract;
    balances: { [key: string]: Uint64 };
}

type CurrentBlockheightOrEstimate = { blockheight: Uint64; estimate: boolean };

interface IDeroChatPiece {
    transfer_identity: number;
    transfer_data: string;
    start: boolean;
    id: number;
    part: number;
    count?: number;
    type?: number;
    state: ChatTransactionState;
}
