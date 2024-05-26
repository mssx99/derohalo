import { createGuaranteeStage } from 'helpers/ContractHelper';
import { useSelector } from 'react-redux';
import store, { RootState } from 'store';
import { guaranteeStateActions } from 'store/reducers/guaranteeStateReducer';
import { getBlockheight, loadContractBalances, useIsWalletAddress, useWalletAddress } from './deroHooks';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import { SCID_DERO } from 'Constants';
import { isSameAddress } from 'helpers/DeroHelper';
import { loadContractAndSet } from 'helpers/Guarantee/GuaranteeSmartContractHelper';

export const setContract: (contract: IGuaranteeContract) => void = (contract) => {
    store.dispatch((dispatch, getState) => {
        const currentBlockheight = getBlockheight(getState());
        dispatch(guaranteeStateActions.setContract({ contract, currentBlockheight }));
    });
};

export const setIsNew: (isNew: boolean) => void = (isNew) => {
    store.dispatch(guaranteeStateActions.setIsNew(isNew));
};

export const useContract = (): { contract: IGuaranteeContract; isNew: boolean; isLoaded: boolean } => {
    const contract: IGuaranteeContract = useSelector((state: RootState) => state.guaranteeState.contract);

    const isNew = useSelector((state: RootState) => state.guaranteeState.isNew);
    const isLoaded = useSelector((state: RootState) => state.guaranteeState.contract.scid) != null;

    return { contract, isNew, isLoaded };
};

export const useContractStats = () => {
    const stats: IGuaranteeStats = useSelector((state: RootState) => state.guaranteeState.guaranteeStats);
    return stats;
};

export const usePartyWallet = (party: 'A' | 'B') => {
    const wallet = useSelector((state: RootState) => state.guaranteeState.contract[party === 'A' ? 'firstPartyWallet' : 'secondPartyWallet']) as IWallet;
    return wallet;
};

export const usePartyLetter = () => {
    const walletAddress = useWalletAddress();
    const { contract } = useContract();
    if (walletAddress && isSameAddress(walletAddress, contract.firstPartyWallet?.address ?? null)) return 'A';
    if (walletAddress && isSameAddress(walletAddress, contract.secondPartyWallet?.address ?? null)) return 'B';
    return null;
};

export const usePreview = (): { preview: boolean; setPreview: (newPreview: boolean) => void } => {
    const preview: boolean = useSelector((state: RootState) => state.guaranteeState.preview);

    const setPreview = (newPreview: boolean) => {
        store.dispatch(guaranteeStateActions.setPreview(newPreview));
    };

    return { preview, setPreview };
};

export const useShowArrows = (): { showArrows: boolean; setShowArrows: (newShowArrows: boolean) => void } => {
    const showArrows: boolean = useSelector((state: RootState) => state.guaranteeState.showArrows);

    const setShowArrows = (newShowArrows: boolean) => {
        store.dispatch(guaranteeStateActions.setShowArrows(newShowArrows));
    };

    return { showArrows, setShowArrows };
};

export const useDisplayBlocks = (): { displayBlocks: boolean; setDisplayBlocks: (newDisplayBlocks: boolean) => void } => {
    const displayBlocks: boolean = useSelector((state: RootState) => state.guaranteeState.displayBlocks);

    const setDisplayBlocks = (newDisplayBlocks: boolean) => {
        store.dispatch(guaranteeStateActions.setDisplayBlocks(newDisplayBlocks));
    };

    return { displayBlocks, setDisplayBlocks };
};

export const setDescription = (description: string) => {
    store.dispatch(guaranteeStateActions.setDescription(description));
};

export const setFirstPartyWallet = (wallet: IWallet) => {
    store.dispatch(guaranteeStateActions.setFirstPartyWallet(wallet));
};

export const setSecondPartyWallet = (wallet: IWallet) => {
    store.dispatch(guaranteeStateActions.setSecondPartyWallet(wallet));
};

export const addStage = () => {
    const newStage = createGuaranteeStage({});
    store.dispatch((dispatch, getState) => {
        const currentBlockheight = getBlockheight(getState());
        store.dispatch(guaranteeStateActions.addStage({ stage: newStage, currentBlockheight }));
    });
};

export const deleteStage = (renderId: string) => {
    store.dispatch((dispatch, getState) => {
        const currentBlockheight = getBlockheight(getState());
        dispatch(guaranteeStateActions.deleteStage({ deleteRenderId: renderId, currentBlockheight }));
    });
};

export const updateStage = (stage: IStage) => {
    store.dispatch((dispatch, getState) => {
        const currentBlockheight = getBlockheight(getState());
        dispatch(guaranteeStateActions.updateStage({ stage, currentBlockheight }));
        dispatch(mainStateActions.updateDialogGuaranteeStage(stage));
    });
};

export const setStages = (stages: IStage[]) => {
    store.dispatch((dispatch, getState) => {
        const currentBlockheight = getBlockheight(getState());
        store.dispatch(guaranteeStateActions.setStages({ stages, currentBlockheight }));
    });
};

export const updateParty = (party: 'A' | 'B', wallet: IWallet) => {
    if (party === 'A') {
        store.dispatch(guaranteeStateActions.setFirstPartyWallet(wallet));
    } else {
        store.dispatch(guaranteeStateActions.setSecondPartyWallet(wallet));
    }
};

export const useGuaranteeSmartContractDeroBalance = () => {
    const deroBalance: Uint64 = useSelector((state: RootState) => state.guaranteeState.smartContractBalances[SCID_DERO]);
    return deroBalance;
};

export const setGuaranteeSmartContractBalances = (balances: { [scid: Hash]: Uint64 }) => {
    store.dispatch(guaranteeStateActions.setSmartContractBalances(balances));
};

export const useIsGuaranteeOwner = () => {
    const { contract } = useContract();
    const isOwner = useIsWalletAddress(contract?.ownerAddress ?? '');

    return isOwner;
};

export const updateGuaranteeContract = () => {
    const scid = store.getState().guaranteeState.contract?.scid;

    if (scid) {
        loadContractAndSet(scid, false);
    }
};
