import DeroBridgeApi from 'libs/DeroBridgeApi';
import to from 'await-to-js';
import { hex_to_ascii } from 'helpers/StringHelper';
import { EmptyResponseError, EntryNotFoundError, UnsupportedOperationError } from 'customErrors';
import { SCID_DERO } from 'Constants';

export default class DeroBridgeImpl implements IDeroInterface {
    deroBridgeApi: DeroBridgeApi | null = null;

    subBlockheightInterval: number = 0;
    subBalanceInterval: number = 0;

    constructor() {}

    async connect() {
        this.deroBridgeApi = new DeroBridgeApi();
        const [err] = await to(this.deroBridgeApi.init());
        if (err) {
            throw err;
        }
    }

    async disconnect() {
        if (this.subBlockheightInterval) window.clearInterval(this.subBlockheightInterval);
        if (this.subBalanceInterval) window.clearInterval(this.subBalanceInterval);
        this.deroBridgeApi = null;
    }

    async getNetworkInfo() {
        const [err, res] = await to(this.deroBridgeApi!.daemon('get-info'));
        checkResponse(err, res, false);

        return res.data.result;
    }

    async getWalletBalance(scid?: string) {
        const [err, res] = await to(
            this.deroBridgeApi!.wallet('get-balance', {
                scid,
            })
        );
        checkResponse(err, res, true);
        if (!scid) scid = SCID_DERO;
        return { scid, balance: res.data.result.balance };
    }

    async getSmartContract({ hexValues, keysstring, ...rpcParams }: ISmartContractCallParameters) {
        const [err, res] = await to(
            this.deroBridgeApi!.daemon('get-sc', {
                keysstring,
                ...rpcParams,
            })
        );

        checkResponse(err, res, false);

        let stringkeys: { [key: string]: string | number } | undefined = undefined;
        if (res.data.result.stringkeys) {
            stringkeys = {};
            for (let key in res.data.result.stringkeys) {
                const value = res.data.result.stringkeys[key];
                if (typeof value === 'string') {
                    stringkeys[key] = hex_to_ascii(value);
                } else {
                    stringkeys[key] = value;
                }
            }
        }

        let valuesstring: string[] | undefined = undefined;
        if (keysstring && res.data.result.valuesstring) {
            valuesstring = res.data.result.valuesstring.map((value: any, index: number) => {
                if (hexValues && hexValues.includes(keysstring[index])) {
                    return hex_to_ascii(value);
                }
                return value;
            });
        }

        return { balance: res.data.result.balance, balances: res.data.result.balances, code: res.data.result.code, status: res.data.result.status, stringkeys, valuesstring };
    }

    async getWalletHeight() {
        const [err, res] = await to(this.deroBridgeApi!.wallet('get-height'));
        checkResponse(err, res, true);
        return res.data.result.height as number;
    }

    async getDaemonHeight() {
        const [err, res] = await to(this.deroBridgeApi!.daemon('get-height'));
        checkResponse(err, res, false);
        return res.data.result.height as number;
    }

    async getRandomAddress() {
        let randomAddress = process.env.REACT_APP_GHOST_ACCOUNT;
        try {
            const [err, res] = await to(this.deroBridgeApi!.daemon('get-random-address'));

            checkResponse(err, res, false);

            randomAddress = res.data.result.address[Math.floor(Math.random() * res.data.result.address.length)];
        } catch (e) {
            console.error(e);
        }
        return randomAddress as string;
    }

    async getGasEstimate({ scid, sc, transfers, sc_rpc, signer, ringsize = 2 }: ITransferParams) {
        const [err, res] = await to(
            this.deroBridgeApi!.daemon('get-gas-estimate', {
                ringsize,
                scid,
                sc,
                transfers,
                sc_rpc,
                signer,
            })
        );

        checkResponse(err, res, false);

        return res.data.result;
    }

    async transfer({ scid, sc, transfers, sc_rpc, description, ringsize = 2 }: ITransferParams) {
        const [err, res] = await to(
            this.deroBridgeApi!.wallet(
                'start-transfer',
                {
                    ringsize,
                    scid,
                    sc,
                    transfers,
                    sc_rpc,
                },
                description
            )
        );

        checkResponse(err, res, true);

        const txid = res.data.result.txid;
        return txid;
    }

    async scInvoke({ scid, sc_rpc, description, sc_dero_deposit, sc_asset_token_deposit, sc_token_deposit, ringsize = 2 }: IScInvokeParams) {
        const transfers = [];
        if (sc_dero_deposit) {
            transfers.push({ destination: await this.getRandomAddress(), burn: sc_dero_deposit });
        }
        if (sc_token_deposit) {
            transfers.push({ destination: await this.getRandomAddress(), scid: sc_asset_token_deposit, burn: sc_token_deposit });
        }
        const SC_ACTION = { name: 'SC_ACTION', datatype: 'U', value: 0 } as IRpc_Arguments;
        const txid = await this.transfer({ scid, transfers, sc_rpc: [SC_ACTION, ...sc_rpc], description, ringsize });
        return txid;
    }

    async nameToAddress(name: string, topoheight: number = -1) {
        const [err, res] = await to(this.deroBridgeApi!.daemon('name-to-address', { name, topoheight }));
        checkResponse(err, res, false);
        return res.data.result.address;
    }

    async getTransactionDaemon(txid: string, needsToBeIncluded?: boolean): Promise<IDeroTransaction> {
        const [err, res] = await to(this.deroBridgeApi!.daemon('get-transaction', { txs_hashes: [txid] }));
        checkResponse(err, res, false);
        const tx = res.data.result.txs[0] as IDeroTransaction;

        if (!needsToBeIncluded) return tx;
        if (tx != null && tx.block_height > 0) return tx;
        throw new Error('Not included yet.');
    }

    async getTransactionWallet(txid: string, needsToBeIncluded?: boolean): Promise<ITransferEntry> {
        throw new UnsupportedOperationError();
    }

    async getTransactionList(params: IGetTransactionListParams): Promise<ITransferEntry[]> {
        throw new UnsupportedOperationError();
    }

    async getWalletAddress() {
        const [err, res] = await to(this.deroBridgeApi!.wallet('get-address'));
        checkResponse(err, res, true);
        return res.data.result.address;
    }

    async subscribeToBlockheight(callback: (topoheight: number) => void) {
        const updateBlockHeight = async () => {
            this.getDaemonHeight().then(callback).catch(console.error);
        };
        this.subBlockheightInterval = window.setInterval(updateBlockHeight, 2000);
    }

    async subscribeToBalance(callback: (walletBalance: IWalletBalance) => void) {
        const updateWalletBalance = async () => {
            this.getWalletBalance()
                .then((balance) => {
                    callback(balance);
                })
                .catch(console.error);
        };
        this.subBalanceInterval = window.setInterval(updateWalletBalance, 2000);
    }

    async subscribeToNewEntry(callback: (newEntry: unknown) => void) {}
}

const checkResponse = (err: any, res: any, isWallet: boolean) => {
    if (err) {
        isPossibleConfigError(err, isWallet);
        throw new Error(err);
    }
    if (res?.data?.error) {
        if (res.data.error.code === -32098) {
            throw new EntryNotFoundError();
        }
        isPossibleConfigError(err, isWallet);
        throw new Error(res.data.error.message);
    }
    if (res == null) {
        throw new Error('No response data.');
    }
};

const isPossibleConfigError = (err: any, isWallet: boolean) => {
    let isNetworkError = false;
    if (err == null) return;
    err = err.toString();

    if (err.indexOf('NetworkError when attempting to fetch resource.') > -1) isNetworkError = true;
    if (err.indexOf('Failed to fetch') > -1) isNetworkError = true;

    if (isNetworkError) {
        if (isWallet) {
            console.error(
                'Please check your wallet configuration in the Dero RPC Bridge Browser-Extension and make sure that your wallet is running with rpc-server param and the credentials are the same:\n./dero-wallet-cli-windows-amd64 --rpc-server --rpc-login <username:password>\n./dero-wallet-cli-linux-amd64 --rpc-server --rpc-login <username:password>'
            );
        } else {
            console.error('Please check your daemon configuration in the Dero RPC Bridge Browser-Extension and make sure that the daemon is running:\n./derod-windows-amd64\n./derod-linux-amd64');
        }
    }
};
