import { isBusy, setBusy } from 'hooks/deroHooks';

export default class WrapperDeroInterface implements IDeroInterface {
    private wrappedInterface: IDeroInterface;
    private callQueue: (() => Promise<any>)[] = [];
    private busy: boolean = false;

    constructor(wrappedInterface: IDeroInterface) {
        this.wrappedInterface = wrappedInterface;
    }

    private async processQueue() {
        while (this.callQueue.length > 0) {
            const call = this.callQueue.shift();
            if (call) {
                await call();
            }
        }
        setBusy(false);
    }

    private enqueueCall<T>(call: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.callQueue.push(async () => {
                try {
                    const result = await call();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            if (!isBusy()) {
                setBusy(true);
                this.processQueue();
            }
        });
    }

    public async connect(): Promise<void> {
        return this.enqueueCall(() => this.wrappedInterface.connect());
    }

    public async disconnect(): Promise<void> {
        return this.enqueueCall(() => this.wrappedInterface.disconnect());
    }

    public async getNetworkInfo(): Promise<INetworkInfo> {
        return this.enqueueCall(() => this.wrappedInterface.getNetworkInfo());
    }

    public async getWalletBalance(scid?: string): Promise<IWalletBalance> {
        return this.enqueueCall(() => this.wrappedInterface.getWalletBalance(scid));
    }

    public async getSmartContract(params: ISmartContractCallParameters): Promise<ISmartContractRawData> {
        return this.enqueueCall(() => this.wrappedInterface.getSmartContract(params));
    }

    public async getWalletHeight(): Promise<number> {
        return this.enqueueCall(() => this.wrappedInterface.getWalletHeight());
    }

    public async getDaemonHeight(): Promise<number> {
        return this.enqueueCall(() => this.wrappedInterface.getDaemonHeight());
    }

    public async getRandomAddress(): Promise<string> {
        return this.enqueueCall(() => this.wrappedInterface.getRandomAddress());
    }

    public async getGasEstimate(params: ITransferParams): Promise<IGasEstimate> {
        return this.enqueueCall(() => this.wrappedInterface.getGasEstimate(params));
    }

    public async transfer(params: ITransferParams): Promise<string> {
        return this.enqueueCall(() => this.wrappedInterface.transfer(params));
    }

    public async scInvoke(params: IScInvokeParams): Promise<string> {
        return this.enqueueCall(() => this.wrappedInterface.scInvoke(params));
    }

    public async nameToAddress(name: string, topoheight: number = -1): Promise<string> {
        return this.enqueueCall(() => this.wrappedInterface.nameToAddress(name, topoheight));
    }

    public async getTransactionDaemon(txid: string, needsToBeIncluded?: boolean): Promise<IDeroTransaction> {
        return this.enqueueCall(() => this.wrappedInterface.getTransactionDaemon(txid, needsToBeIncluded));
    }

    public async getTransactionWallet(txid: string, needsToBeIncluded?: boolean): Promise<ITransferEntry> {
        return this.enqueueCall(() => this.wrappedInterface.getTransactionWallet(txid, needsToBeIncluded));
    }

    public async getTransactionList(params: IGetTransactionListParams): Promise<ITransferEntry[]> {
        return this.enqueueCall(() => this.wrappedInterface.getTransactionList(params));
    }

    public async getWalletAddress(): Promise<string> {
        return this.enqueueCall(() => this.wrappedInterface.getWalletAddress());
    }

    async subscribeToBlockheight(callback: (topoheight: number) => void) {
        await this.wrappedInterface.subscribeToBlockheight(callback);
    }

    async subscribeToBalance(callback: (walletBalance: IWalletBalance) => void) {
        await this.wrappedInterface.subscribeToBalance(callback);
    }

    async subscribeToNewEntry(callback: (newEntry: unknown) => void) {
        await this.wrappedInterface.subscribeToNewEntry(callback);
    }
}
