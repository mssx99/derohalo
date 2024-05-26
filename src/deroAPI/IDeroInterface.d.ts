interface IDeroInterface {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    getNetworkInfo: () => Promise<INetworkInfo>;
    getWalletBalance: (scid?: string) => Promise<IWalletBalance>;
    getSmartContract: (params: ISmartContractCallParameters, waitAfterNewBlock?: true) => Promise<ISmartContractRawData>;
    getWalletHeight: () => Promise<number>;
    getDaemonHeight: () => Promise<number>;
    getRandomAddress: () => Promise<string>;
    getGasEstimate: (params: ITransferParams) => Promise<{ gascompute: Uint64; gasstorage: Uint64; status: string }>;
    transfer: (params: ITransferParams) => Promise<string>;
    scInvoke: (params: IScInvokeParams) => Promise<string>;
    nameToAddress: (name: string, topoheight: number = -1) => Promise<string>;
    getTransactionDaemon: (txid: string, needsToBeIncluded?: boolean) => Promise<IDeroTransaction>;
    getTransactionWallet: (txid: string, needsToBeIncluded?: boolean) => Promise<ITransferEntry>;
    getTransactionList: (params: IGetTransactionListParams) => Promise<ITransferEntry[]>;
    getWalletAddress: () => Promise<string>;
    subscribeToBlockheight: (callback: (topoheight: number) => void) => Promise<void>;
    subscribeToBalance: (callback: (walletBalance: IWalletBalance) => void) => Promise<void>;
    subscribeToNewEntry: (callback: (newEntry: unknown) => void) => Promise<void>;
}

interface IWalletBalance {
    scid: string;
    balance: number;
}

interface INetworkInfo {
    alt_blocks_count: number;
    difficulty: number;
    grey_peerlist_size: number;
    height: number;
    stableheight: number;
    topoheight: number;
    treehash: string;
    averageblocktime50: number;
    incoming_connections_count: number;
    outgoing_connections_count: number;
    target: number;
    target_height: number;
    testnet: boolean;
    network: string;
    top_block_hash: string;
    tx_count: number;
    tx_pool_size: number;
    dynamic_fee_per_kb: number;
    total_supply: number;
    median_block_size: number;
    white_peerlist_size: number;
    version: string;
    connected_miners: number;
    miniblocks_in_memory: number;
    blocks_count: number;
    miniblocks_accepted_count: number;
    miniblocks_rejected_count: number;
    mining_velocity: number;
    uptime: number;
    hashrate_1hr: number;
    hashrate_1d: number;
    hashrate_7d: number;
    status: string;
}

interface ISmartContractCallParameters {
    scid: string;
    variables?: boolean;
    code?: boolean;
    topoheight?: number;
    keysuint64?: number[];
    keysstring?: string[];
    keysbytes?: Int8Array[];

    hexValues?: string[];
}

interface ISmartContractRawData {
    balance: Uint64;
    code: string;
    status: string;
    balances?: { [scid: Hash]: Uint64 };
    stringkeys?: { [key: string]: string | Uint64 };
    valuesstring?: string[];
    valuesuint64?: string[];
    valuesbytes?: string[];
}

interface ITransferParams {
    ringsize?: number;
    sc?: string;
    scid?: Hash;
    fees?: Uint64;
    signer?: string;
    transfers?: ITransferDestination[];
    sc_rpc?: IRpc_Arguments[];
    description?: { [scParameterName: string]: ISc_Description };
}

interface IGasEstimate {
    gascompute: Uint64;
    gasstorage: Uint64;
    status: string;
}

interface ITransferDestination {
    destination: string;
    scid?: Hash;
    burn?: Uint64;
    amount?: Uint64;
    payload_rpc?: IRpc_Arguments[];
}

interface IRpc_Arguments {
    name: DVMString;
    datatype: 'S' | 'U' | 'H';
    value: DVMString | number;
}

interface ISc_Description {
    name: string;
    value: string;
}

interface IScInvokeParams {
    scid: Hash;
    sc_rpc: IRpc_Arguments[];
    description?: { [scParameterName: string]: ISc_Description };

    sc_dero_deposit?: Uint64;
    sc_asset_token_deposit?: Hash;
    sc_token_deposit?: Uint64;
    ringsize?: Uint64;
}

interface ITransferEntry {
    height: Uint64;
    topoheight: Uint64;
    blockhash: Hash;
    minerreward: number;
    tpos: number;
    pos: number;
    coinbase: boolean;
    incoming: boolean;
    txid: Hash;
    destination: string;
    amount: Uint64;
    fees: Uint64;
    proof: string;
    status: number;
    time: string;
    ewdata: string;
    data: string;
    payloadtype: number;
    payload: string;
    payload_rpc: {
        name: string;
        datatype: 'S' | 'U';
        value: DVMString | Uint64;
    }[];
    sender: string;
    dstport: number;
    srcport: number;
}

interface IGetTransactionListParams {
    scid?: Hash;
    coinbase?: boolean;
    in?: boolean;
    out?: boolean;
    min_height?: Uint64;
    max_height?: Uint64;
    sender?: DVMString;
    receiver?: DVMString;
    dstport?: Uint64;
    srcport?: Uint64;
}

type Uint64 = number;
type DVMString = string;
type Hash = string;

interface IDeroTransaction {
    as_hex: string;
    balance: Uint64;
    balancenow: Uint64;
    block_height: Uint64;
    code: string;
    codenow: string;
    ignored: boolean;
    in_pool: boolean;
    invalid_block: any;
    output_indices: any;
    reward: number;
    ring: any;
    signer: string;
    tx_hash: string;
    valid_block: string;
}
