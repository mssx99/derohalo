import { BASE_BLOCKHEIGHT, DEFAULT_BLOCKTIME, MAX_RETRIES, RETRY_DELAY } from 'Constants';
import { bindArguments, retryOperation } from './Helper';
import to from 'await-to-js';
import { hex_to_ascii } from './StringHelper';
import dayjs from 'dayjs';
import { getDeroInterface, updateWalletBalance } from 'hooks/deroHooks';

export const waitForTransaction = async (txid: string, needsToBeIncluded: boolean) => {
    console.log('Waiting for transaction to be included in block...');
    const deroInterface = getDeroInterface();
    const [err, tx] = await to(retryOperation(deroInterface.getTransactionDaemon.bind(deroInterface, txid, needsToBeIncluded), RETRY_DELAY, MAX_RETRIES));
    if (err) throw err;
    return tx;
};

export const installSmartContract = async (sc: string, ringsize: number = 2) => {
    return await getDeroInterface().transfer({ ringsize, sc });
};

export const scInvoke = async ({
    scid,
    entrypoint,
    sc_rpc,
    description,
    sc_dero_deposit,
    sc_asset_token_deposit,
    sc_token_deposit,
    ringsize = 2,
    waitFor = false,
}: {
    scid: string;
    entrypoint?: string;
    sc_rpc: IRpc_Arguments[];
    description?: { [scParameterName: string]: ISc_Description };
    sc_dero_deposit?: number;
    sc_asset_token_deposit?: string;
    sc_token_deposit?: number;
    ringsize?: number;
    waitFor: boolean;
}) => {
    if (!entrypoint) {
        if (sc_rpc) {
            const temp = sc_rpc.find((s) => s.name === 'entrypoint');
            if (temp) {
                entrypoint = temp.value as string;
                sc_rpc = sc_rpc.filter((s) => s.name !== 'entrypoint');
            }
        }
    }
    if (!entrypoint) {
        throw new Error('Entrypoint required.');
    }
    const ENTRYPOINT = { name: 'entrypoint', datatype: 'S', value: entrypoint } as IRpc_Arguments;
    const txid = await getDeroInterface().scInvoke({ scid, sc_rpc: [ENTRYPOINT, ...sc_rpc], description, sc_dero_deposit, sc_asset_token_deposit, sc_token_deposit, ringsize });
    if (waitFor) {
        await waitForTransaction(txid, true);
        await updateWalletBalance();
    }
    return txid;
};

export const scInvokeWithGasEstimate = async ({
    scid,
    entrypoint,
    sc_rpc,
    description,
    sc_dero_deposit,
    sc_asset_token_deposit,
    sc_token_deposit,
    ringsize = 2,
    signer,
    waitFor = false,
}: {
    scid: string;
    entrypoint: string;
    sc_rpc: IRpc_Arguments[];
    description?: { [scParameterName: string]: ISc_Description };
    sc_dero_deposit?: number;
    sc_asset_token_deposit?: string;
    sc_token_deposit?: number;
    ringsize?: number;
    signer?: string;
    waitFor: boolean;
}) => {
    const { gascompute, gasstorage, status } = await getGasEstimate({ scid, entrypoint, sc_rpc, signer });

    console.log('gasstorage', gasstorage);

    const mergedSc_rpc: IRpc_Arguments[] = [
        { name: 'SC_ACTION', datatype: 'U', value: 0 },
        { name: 'SC_ID', datatype: 'H', value: scid },
        { name: 'entrypoint', datatype: 'S', value: entrypoint },
        ...sc_rpc,
    ];

    //TODO add transfers

    const txid = await getDeroInterface().transfer({ sc_rpc: mergedSc_rpc, ringsize, fees: gasstorage });

    if (waitFor) {
        await waitForTransaction(txid, true);
        await updateWalletBalance();
    }

    return txid;
};

export const getGasEstimate = async ({ scid, entrypoint, sc_rpc, signer }: { scid: string; entrypoint: string; sc_rpc: IRpc_Arguments[]; signer?: string }) => {
    const mergedSc_rpc: IRpc_Arguments[] = [
        { name: 'SC_ACTION', datatype: 'U', value: 0 },
        { name: 'SC_ID', datatype: 'H', value: scid },
        { name: 'entrypoint', datatype: 'S', value: entrypoint },
        ...sc_rpc,
    ];

    //TODO add transfers
    const transfers: ITransferDestination[] = [];

    const result = getDeroInterface().getGasEstimate({ sc_rpc: mergedSc_rpc, transfers, signer });

    return result;
};

export const isSameAddress = (address1: string | null, address2: string | null) => {
    if (address1 == address2) return true;
    if (!isDeroAddress(address1) || !isDeroAddress(address2)) return false;
    return convertToFormatIndependentDeroAddress(address1) == convertToFormatIndependentDeroAddress(address2);
};

export const shortenScid = (scid: string | null, length: number = 12) => {
    if (!scid) return '<empty>';
    if (scid.length != 66) return '<invalid>';
    return '...' + scid.substring(scid.length - length, scid.length);
};

export const getDeroAddress = async (addressName: string | null) => {
    if (!addressName) return '<empty>';

    return await getDeroInterface().nameToAddress(addressName);
};

export const isDeroAddress = (potentialAddress: string | null): boolean => {
    if (!potentialAddress) return false;
    const regex = /^(dero|deto)[a-zA-Z0-9]{62}$/;
    return regex.test(potentialAddress);
};

export const isSmartContractId = (potentialScid: string | null) => {
    if (!potentialScid) return false;
    const regex = /^[0-9a-fA-F]{64}$/;
    return regex.test(potentialScid);
};

export const checkScidExists = async (potentialScid: Hash | null) => {
    if (!potentialScid) return false;
    try {
        await getDeroInterface().getSmartContract({ scid: potentialScid });
        return true;
    } catch (e) {
        return false;
    }
};

export const parseIntValuesString = (valuesstring: string[], index: number) => {
    if (index >= valuesstring.length) {
        return null;
    }
    const str = valuesstring[index];
    if (str == null || str.startsWith('NOT AVAILABLE err:')) {
        return null;
    }
    return parseInt(str);
};

export const parseDVMString = (valuesstring: string[], index: number) => {
    if (index >= valuesstring.length) {
        return null;
    }
    const str = valuesstring[index];
    if (str == null || str.startsWith('NOT AVAILABLE err:')) {
        return null;
    } else {
        return hex_to_ascii(str);
    }
    return str;
};

export const convertToFormatIndependentDeroAddress = (address: string | null) => {
    if (!address) return null;
    if (!isDeroAddress(address)) {
        throw new Error('No Dero address: ' + address);
    }

    return address.substring(4, 60);
};

export const convertFormatIndependentToWalletAddress = (shortAddress: string, walletAddresses: IWallet[]) => {
    const found = walletAddresses.find((wa) => wa.address && convertToFormatIndependentDeroAddress(wa.address) == shortAddress);
    if (found) {
        return found.address!;
    }
    throw new Error(`Not present ${shortAddress} in ${JSON.stringify(walletAddresses)}`);
};

export const getWalletAddress = (value: IWalletDirectoryEntry | string | null) => {
    if (!value) return null;
    if (typeof value === 'string') return value as string;
    return value.address ?? null;
};

export const getSmartContractId = (value: ISmartContractDirectoryEntry | string | null) => {
    if (!value) return null;
    if (typeof value === 'object') {
        return value.scid ?? null;
    }
    return value ?? null;
};

export interface ITimeCount {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export const convertBlocksToTimeCount = (blocks: Uint64) => {
    const totalSeconds = blocks * DEFAULT_BLOCKTIME;
    let remainingSeconds = totalSeconds;

    const years = Math.floor(remainingSeconds / (365 * 24 * 60 * 60));
    remainingSeconds -= years * 365 * 24 * 60 * 60;

    const months = Math.floor(remainingSeconds / (30 * 24 * 60 * 60));
    remainingSeconds -= months * 30 * 24 * 60 * 60;

    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
    remainingSeconds -= days * 24 * 60 * 60;

    const hours = Math.floor(remainingSeconds / (60 * 60));
    remainingSeconds -= hours * 60 * 60;

    const minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds -= minutes * 60;

    const seconds = remainingSeconds;

    return { years, months, days, hours, minutes, seconds };
};

export const convertTimeCountToBlocks = (timeCount: ITimeCount) => {
    const { years, months, days, hours, minutes, seconds } = timeCount;

    const totalSeconds = years * 365 * 24 * 60 * 60 + months * 30 * 24 * 60 * 60 + days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;

    return Math.floor(totalSeconds / 18);
};

export const calculateEstimatedBlockheight = () => {
    const secondsPassed = dayjs().diff(BASE_BLOCKHEIGHT.timestamp);
    const blocks = Math.floor(secondsPassed / DEFAULT_BLOCKTIME / 1000);
    return BASE_BLOCKHEIGHT.block + blocks;
};

export const calculateEstimatedDate = (blockheight: Uint64, currentBlockheight?: Uint64) => {
    if (currentBlockheight) {
        const blocksToGo = blockheight - currentBlockheight;
        return dayjs().add(blocksToGo * DEFAULT_BLOCKTIME, 'second');
    }
    const blocksToGo = blockheight - BASE_BLOCKHEIGHT.block;
    return BASE_BLOCKHEIGHT.timestamp.add(blocksToGo * DEFAULT_BLOCKTIME, 'second');
};

export const getTimeSpan = ({
    years = 0,
    months = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
}: {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}): number => {
    return Math.floor((years * 31536000 + months * 2592000 + days * 86400 + hours * 3600 + minutes * 60 + seconds) / DEFAULT_BLOCKTIME);
};
