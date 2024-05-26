import { APP_NAME, SCID_DERO } from 'Constants';
import { AuthorizationError, EmptyResponseError, EntryNotFoundError, NotIncludedInBlockchainError, UnsupportedOperationError } from 'customErrors';
import { wait } from 'helpers/Helper';
import { hex_to_ascii } from 'helpers/StringHelper';
import { setTopoheight, setWalletBalance } from 'hooks/deroHooks';
import React, { Dispatch, SetStateAction } from 'react';
import store from 'store';
import { Api, AppInfo, generateAppId } from 'dero-xswd-api';

export default class DeroXswdImpl implements IDeroInterface {
    xswd = new Api(appInfo);

    subBlockheightInterval: number = 0;
    subBalanceInterval: number = 0;

    constructor(config?: { ip: string; port: number; debug?: boolean }) {
        if (config) {
            this.xswd = new Api(appInfo, config);
        }
    }

    async connect() {
        await this.xswd.initialize();
    }

    async disconnect() {
        if (this.subBlockheightInterval) window.clearInterval(this.subBlockheightInterval);
        if (this.subBalanceInterval) window.clearInterval(this.subBalanceInterval);
        await this.xswd.close();
    }

    async getNetworkInfo() {
        const response = await this.xswd.node.GetInfo();

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            return response.result;
        }

        throw new EmptyResponseError();
    }

    async getWalletBalance(scid?: string) {
        const response = await this.xswd.wallet.GetBalance({ scid });

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            if (!scid) scid = SCID_DERO;
            return { scid, balance: response.result.balance };
        }

        throw new EmptyResponseError();
    }

    async getSmartContract({ hexValues, keysstring, variables = true, code = false, ...rpcParams }: ISmartContractCallParameters, waitAfterNewBlock?: true) {
        const response = await this.xswd.node.GetSC({ keysstring, variables, code, ...rpcParams }, waitAfterNewBlock);

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            let stringkeys: { [key: string]: string | number } | undefined = undefined;
            if (response.result.stringkeys) {
                stringkeys = {};
                for (let key in response.result.stringkeys) {
                    const value = response.result.stringkeys[key];
                    if (typeof value === 'string') {
                        stringkeys[key] = hex_to_ascii(value);
                    } else {
                        stringkeys[key] = value;
                    }
                }
            }

            let valuesstring: string[] | undefined = undefined;
            if (keysstring && response.result.valuesstring) {
                valuesstring = response.result.valuesstring.map((value, index) => {
                    if (hexValues && value && hexValues.includes(keysstring[index])) {
                        return hex_to_ascii(value);
                    }
                    return value;
                });
            }

            if (!response.result?.balances && variables) {
                throw new EntryNotFoundError();
            }

            return { balance: response.result.balance, balances: response.result.balances, code: response.result.code?.valueOf(), status: response.result.status, stringkeys, valuesstring };
        }

        throw new EmptyResponseError();
    }

    async getWalletHeight() {
        const response = await this.xswd.wallet.GetHeight();

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            return response.result.height;
        }

        throw new EmptyResponseError();
    }

    async getDaemonHeight() {
        const response = await this.xswd.node.GetHeight();

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            //console.log(response.result);
            //returns topoheight/stableheight as well
            return response.result.height;
        }

        throw new EmptyResponseError();
    }

    async getRandomAddress() {
        const response = await this.xswd.node.GetRandomAddress();

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            const randomNumber = Math.floor(Math.random() * 100);
            return response.result.address[randomNumber];
        }

        throw new EmptyResponseError();
    }

    async getGasEstimate(params: ITransferParams) {
        const response = await this.xswd.node.GetGasEstimate(params);

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            return response.result as { gascompute: Uint64; gasstorage: Uint64; status: string };
        }

        throw new EmptyResponseError();
    }

    async transfer(params: ITransferParams) {
        const { description, ...rpcParams } = params;
        const response = await this.xswd.wallet.transfer(rpcParams);

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            return response.result.txid;
        }

        throw new EmptyResponseError();
    }

    async scInvoke({ scid, sc_rpc, description, sc_dero_deposit, sc_asset_token_deposit, sc_token_deposit, ringsize = 2 }: IScInvokeParams) {
        if (sc_token_deposit && sc_asset_token_deposit !== scid) {
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
        console.log('scinvoke', { scid, sc_rpc, sc_dero_deposit: sc_dero_deposit, sc_token_deposit, ringsize });
        const response = await this.xswd.wallet.scinvoke({ scid, sc_rpc, sc_dero_deposit: sc_dero_deposit, sc_token_deposit, ringsize });

        if ('result' in response) {
            return response.result.txid;
        }

        throw new EmptyResponseError();
    }

    async nameToAddress(name: string, topoheight: number = -1) {
        const response = await this.xswd.node.NameToAddress({ name, topoheight });

        if ('error' in response) {
            if (response.error.message?.startsWith('Error on daemon call: "[-32098] leaf not found:')) {
                throw new EntryNotFoundError();
            }
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            return response.result.address;
        }

        throw new EmptyResponseError();
    }

    async getTransactionDaemon(txid: string, needsToBeIncluded?: boolean): Promise<IDeroTransaction> {
        const response = await this.xswd.node.GetTransaction({ txs_hashes: [txid], decode_as_json: 1 });

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            const tx = response.result.txs![0] as IDeroTransaction;
            if (!needsToBeIncluded) {
                return tx;
            }
            if (tx.block_height > -1) {
                console.log('Transaction has been included.', tx);
                return tx;
            }
            throw new NotIncludedInBlockchainError();
        }

        throw new EmptyResponseError();
    }

    async getTransactionWallet(txid: string, needsToBeIncluded?: boolean) {
        const response = await this.xswd.wallet.GetTransferbyTXID({ txid });

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            return response.result.entry as ITransferEntry;
        }

        throw new EmptyResponseError();
    }

    async getTransactionList(params: IGetTransactionListParams) {
        const response = await this.xswd.wallet.GetTransfers(params);

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            return response.result.entries;
        }

        throw new EmptyResponseError();
    }

    async getWalletAddress() {
        const response = await this.xswd.wallet.GetAddress();

        if ('error' in response) {
            throw new Error(response.error.message);
        }
        if ('result' in response) {
            return response.result.address;
        }

        throw new EmptyResponseError();
    }

    async subscribeToBlockheight(callback: (topoheight: number) => void) {
        const network = store.getState().mainState.networkInfo?.network;

        if (network === 'Simulator') {
            const updateBlockHeight = async () => {
                this.getDaemonHeight().then(callback).catch(console.error);
            };
            this.subBlockheightInterval = window.setInterval(updateBlockHeight, 2000);
        } else {
            await this.xswd.subscribe({
                event: 'new_topoheight',
                callback,
            });
        }
    }

    async subscribeToBalance(callback: (walletBalance: IWalletBalance) => void) {
        const network = store.getState().mainState.networkInfo?.network;

        if (network === 'Simulator') {
            const updateWalletBalance = async () => {
                this.getWalletBalance()
                    .then((balance) => {
                        callback(balance);
                    })
                    .catch(console.error);
            };
            this.subBalanceInterval = window.setInterval(updateWalletBalance, 2000);
        } else {
            await this.xswd.subscribe({
                event: 'new_balance',
                callback,
            });
        }
    }

    async subscribeToNewEntry(callback: (newEntry: unknown) => void) {
        await this.xswd.subscribe({
            event: 'new_entry',
            callback,
        });
    }
}

const appInfo: AppInfo = {
    id: await generateAppId(APP_NAME + (process.env.NODE_ENV === 'development' ? Math.random() : '')),
    name: APP_NAME,
    description: 'MultiSignature and Guarantee SmartContracts ShowCase',
};

type Uint64 = number;
export type Hash = string;
export type DataType = 'S' | 'U' | 'H';
