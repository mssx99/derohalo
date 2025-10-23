import { useState, useEffect } from 'react';
import store, { RootState } from 'store';
import { useSelector } from 'react-redux';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import { DEFAULT_BLOCKTIME, SCID_DERO, BASE_BLOCKHEIGHT, XSWD_DEFAULTPORT, MESSAGE_SEVERITY } from 'Constants';
import dayjs from 'dayjs';
import { getConnectionType, getXswdPort, useForceUpdate } from './mainHooks';
import { calculateEstimatedBlockheight, calculateEstimatedDate, isSameAddress } from 'helpers/DeroHelper';
import { formatTime } from 'helpers/FormatHelper';
import { multiSigStateActions } from 'store/reducers/multiSigStateReducer';
import { guaranteeStateActions } from 'store/reducers/guaranteeStateReducer';
import { loadChatMessages } from 'helpers/ChatHelper';
import { updateWebContract } from './webHooks';
import { updateMultiSigContract } from './multiSigHooks';
import { updateGuaranteeContract } from './guaranteeHooks';

import { create } from 'zustand';
import WrapperDeroInterface from 'deroAPI/WrapperDeroInterface';
import DeroBridgeImpl from 'deroAPI/DeroBridgeImpl';
import DeroXswdImpl from 'deroAPI/DeroXswdImpl';
import { addSnackbar } from 'components/screen/Snackbars';
import { ProtocolHelper } from 'helpers/ProtocolHelper';
import { loadLastOpenedContractsOnConnect } from 'helpers/ContractHelper';
import { initWebContract } from 'helpers/Web/WebContractHelper';

interface IDeroBridgeStore {
    deroInterface: IDeroInterface | null;
    isBusy: boolean;
    setBusy: (isBusy: boolean) => void;
    isConnected: boolean;
    connect: (deroInterface: IDeroInterface) => Promise<void>;
    disconnect: () => Promise<void>;
}

const useDeroBridgeStore = create<IDeroBridgeStore>((set, get) => ({
    deroInterface: null,
    isBusy: false,
    setBusy: (isBusy: boolean) => set({ isBusy }),
    isConnected: false,
    connect: async (deroInterface: IDeroInterface) => {
        const { disconnect } = get();
        disconnect();
        deroInterface = new WrapperDeroInterface(deroInterface);

        let isConnected = false;
        try {
            await deroInterface.connect();
            isConnected = true;
        } catch (e) {
            throw e;
        }
        set({ isConnected, deroInterface });
    },
    disconnect: async () => {
        let { deroInterface } = get();
        if (deroInterface) {
            try {
                await deroInterface.disconnect();
            } catch (e) {}
            deroInterface = null;
        }
        set({ deroInterface, isConnected: false });
    },
}));

export const isConnected = (): boolean => {
    return useDeroBridgeStore.getState().isConnected;
};

export const useIsConnected = () => {
    return useDeroBridgeStore((state) => state.isConnected);
};

export const isBusy = (): boolean => {
    return useDeroBridgeStore.getState().isBusy;
};

export const setBusy = (isBusy: boolean) => {
    useDeroBridgeStore.getState().setBusy(isBusy);
};

export const useBusy = () => {
    return useDeroBridgeStore((state) => state.isBusy);
};

export const getDeroInterface = (): IDeroInterface => {
    const deroInterface = useDeroBridgeStore.getState().deroInterface;
    if (!deroInterface) {
        throw new Error('Dero is not connected and running.');
    }
    return deroInterface;
};

export const doConnect = async () => {
    const connectionType = getConnectionType();
    const xswdport = getXswdPort();
    const { connect } = useDeroBridgeStore.getState();

    try {
        if (connectionType === 'bridge') {
            await connect(new DeroBridgeImpl());
        } else {
            if (xswdport !== XSWD_DEFAULTPORT) {
                await connect(new DeroXswdImpl({ ip: 'localhost', port: xswdport, debug: false }));
            } else {
                await connect(new DeroXswdImpl());
            }
        }
        doOnConnectionStart();

        addSnackbar({ message: `Connected successfully to ${connectionType}.`, severity: MESSAGE_SEVERITY.SUCCESS });
    } catch (e) {
        addSnackbar({ message: `Error while connecting to ${connectionType}.`, severity: MESSAGE_SEVERITY.ERROR });
    }
};

export const doDisconnect = () => {
    const connectionType = getConnectionType();
    const { disconnect } = useDeroBridgeStore.getState();

    disconnect();
    doOnConnectionEnd();
    addSnackbar({ message: `Disconnected successfully from ${connectionType}.`, severity: MESSAGE_SEVERITY.SUCCESS });
};

const doOnConnectionStart = async () => {
    await updateNetworkInfo();
    await updateWalletAddress();
    await updateWalletBalance();
    await subscribeToDeroEvents();
    await initWebContract();
    await loadLastOpenedContractsOnConnect();

    ProtocolHelper.doPendingAction();
};

const doOnConnectionEnd = async () => {
    setNetworkInfo(null);
};

export const useNetworkInfo = () => {
    const networkInfo = useSelector((state: RootState) => state.mainState.networkInfo);
    return { networkInfo };
};

export const setWalletBalance = (walletBalance: IWalletBalance, clearOthers: boolean = false) => {
    store.dispatch(mainStateActions.setWalletBalance({ walletBalance }));
};

export const useWalletBalance = (scid?: string) => {
    if (!scid) scid = SCID_DERO;
    const walletBalance = useSelector((state: RootState) => state.mainState.walletBalance[scid as string]);
    return walletBalance;
};

export const updateWalletBalance = async () => {
    const walletBalance = await getDeroInterface().getWalletBalance();
    setWalletBalance(walletBalance);
};

export const setWalletAddress = (walletAddress: string | null) => {
    store.dispatch(mainStateActions.setWalletAddress(walletAddress));
};

export const getWalletAddress = () => {
    return store.getState().mainState.walletAddress as string | null;
};

export const useWalletAddress = () => {
    const walletAddress = useSelector((state: RootState) => state.mainState.walletAddress);
    return walletAddress;
};

export const useIsWalletAddress = (address: string) => {
    const walletAddress = useSelector((state: RootState) => state.mainState.walletAddress);
    return isSameAddress(walletAddress, address);
};

export const updateWalletAddress = async () => {
    const walletAddress = await getDeroInterface().getWalletAddress();
    setWalletAddress(walletAddress);
};

export const updateNetworkInfo = async () => {
    const networkInfo = await getDeroInterface().getNetworkInfo();
    setNetworkInfo(networkInfo);
};

export const setNetworkInfo = (networkInfo: INetworkInfo | null) => {
    store.dispatch(mainStateActions.setNetworkInfo({ networkInfo }));
};

export const getTopoheight = () => {
    return store.getState().mainState.networkInfo?.topoheight ?? 0;
};

export const setTopoheight = (topoheight: number) => {
    store.dispatch(mainStateActions.setTopoheight(topoheight));
};

export const useCurrentBlockheight = () => {
    const currentBlockheight = useSelector((state: RootState) => state.mainState.networkInfo?.topoheight);
    return currentBlockheight;
};

export const useCurrentBlockheightOrEstimate = () => {
    const isConnected = useIsConnected();
    const currentBlockheight = { blockheight: useSelector((state: RootState) => state.mainState.networkInfo?.topoheight) ?? calculateEstimatedBlockheight(), timestamp: dayjs() };
    const [estimatedBlockheight, setEstimatedBlockheight] = useState<number>(currentBlockheight.blockheight);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (!isConnected) {
            intervalId = setInterval(() => {
                let estimate = calculateEstimatedBlockheight();
                if (estimate < estimatedBlockheight) estimate = estimatedBlockheight + 1;
                setEstimatedBlockheight(estimate);
            }, DEFAULT_BLOCKTIME * 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isConnected]);

    return isConnected ? { blockheight: currentBlockheight.blockheight, estimate: false } : { blockheight: estimatedBlockheight, estimate: true };
};

// export const formatCurrentBlockheightOrEstimateAsDate = (currentBlockheightOrEstimate: { blockheight: Uint64; estimate: boolean }) => {
//     if (currentBlockheightOrEstimate.estimate) {
//         return `Estimated Date using estimated blockheight: ${formatTime(calculateEstimatedDate(currentBlockheightOrEstimate.blockheight))}`;
//     }
//     return `Estimated Date of blockheight: ${formatTime(calculateEstimatedDate(currentBlockheightOrEstimate.blockheight))}`;
// };

export const useBlockheightDate = (blocks: Uint64 | null) => {
    const currentBlockheight = useSelector((state: RootState) => state.mainState.networkInfo?.topoheight);

    if (!blocks) return null;

    if (!currentBlockheight) {
        const hardCodedUtc = dayjs('2024-02-24T18:39:00Z');
        const hardCodedBlock = 3344776;

        const differenceInBlocks = blocks - hardCodedBlock;
        return hardCodedUtc.add(differenceInBlocks * DEFAULT_BLOCKTIME, 'second');
    }
    const differenceInBlocks = blocks - currentBlockheight;
    return dayjs().add(differenceInBlocks * DEFAULT_BLOCKTIME, 'second');
};

export const getBlockheight = (state?: RootState) => {
    return state ? state.mainState.networkInfo?.topoheight ?? 0 : store.getState().mainState.networkInfo?.topoheight ?? 0;
};

export const useBlockchainInfo = () => {
    const topoheight = useCurrentBlockheight();
    const averageblocktime50 = useSelector((state: RootState) => state.mainState.networkInfo?.averageblocktime50 ?? DEFAULT_BLOCKTIME);
    const network = useSelector((state: RootState) => state.mainState.networkInfo?.network);

    return { blockheight: topoheight, blocktime: averageblocktime50, network };
};

export const subscribeToDeroEvents = () => {
    getDeroInterface().subscribeToBlockheight(async (topoheight: Uint64) => {
        if (topoheight <= getTopoheight()) return;
        setTopoheight(topoheight);

        loadChatMessages(topoheight);
        updateWebContract();
        updateGuaranteeContract();
        updateMultiSigContract();
    });
    // await getDeroInterface().subscribeToBalance((walletBalance: IWalletBalance) => {
    //     setWalletBalance(walletBalance);
    // });
    // await getDeroInterface().subscribeToNewEntry((entry: unknown) => {
    //     const typedEntry = entry as ITransferEntry;
    //     console.log('sub typedEntry', typedEntry, new Date());
    // });
};

export const loadContractBalances = async (scid: string) => {
    const result = await getDeroInterface().getSmartContract({ scid, variables: true });
    return result.balances as { [scid: Hash]: Uint64 };
};

export const loadContractDeroBalance = async (scid: string) => {
    const result = await getDeroInterface().getSmartContract({ scid, variables: false });
    return result.balance;
};

export const setSmartContractBalances = (scid: Hash, balances: number | { [scid: Hash]: Uint64 }) => {
    const multiSigScid = store.getState().multiSigState.contract.scid;
    const guaranteeScid = store.getState().guaranteeState.contract.scid;

    if (multiSigScid === scid) {
        store.dispatch(multiSigStateActions.setSmartContractBalances(balances));
    } else if (guaranteeScid === scid) {
        store.dispatch(guaranteeStateActions.setSmartContractBalances(balances));
    }
};

export const updateSmartContractBalances = async (scid: string) => {
    const balances = await loadContractBalances(scid);
    setSmartContractBalances(scid, balances);
};

export const useSmartContractBalances = (type: SmartContractType) => {
    const balances: { [key: string]: Uint64 } = useSelector((state: RootState) =>
        type === 'MULTISIGNATURE' ? state.multiSigState.smartContractBalances : type === 'GUARANTEE' ? state.guaranteeState.smartContractBalances : state.webState.smartContractBalances
    );
    return balances;
};

export const useSmartContractDeroBalance = (type: SmartContractType) => {
    const balance = useSelector((state: RootState) =>
        type === 'MULTISIGNATURE'
            ? state.multiSigState.smartContractBalances[SCID_DERO]
            : type === 'GUARANTEE'
            ? state.guaranteeState.smartContractBalances[SCID_DERO]
            : state.webState.smartContractBalances[SCID_DERO]
    );
    return balance;
};

export const updateSmartContractDeroBalance = async (scid: string) => {
    const balance = await loadContractDeroBalance(scid);
    setSmartContractBalances(scid, balance);
};
