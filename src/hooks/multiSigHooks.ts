import { createAuthorizationGroup, createWallet } from 'helpers/ContractHelper';
import { useSelector } from 'react-redux';
import store, { RootState } from 'store';
import { DragStart } from 'react-beautiful-dnd';
import { multiSigStateActions } from 'store/reducers/multiSigStateReducer';
import _ from 'underscore';
import { mainStateActions } from 'store/reducers/mainStateReducer';
import { MultiSigContractLoadError } from 'customErrors';
import { SCID_DERO } from 'Constants';
import { waitForTransaction } from 'helpers/DeroHelper';
import { updateWallets } from 'helpers/DirectoryHelper';
import { loadContractBalances } from './deroHooks';
import { loadContractAndSet } from 'helpers/MultiSig/MultiSigSmartContractHelper';
import { TRANSACTION_DIALOG_NAME } from 'components/MultiSigDesigner/Transactions/dialogs/TransactionDialog';

export const setContract: (contract: IMultiSigContract) => void = (contract) => {
    store.dispatch((dispatch, getState) => {
        dispatch(multiSigStateActions.setContract(contract));

        const dialogs = getState().mainState.dialogs;
        if (dialogs.hasOwnProperty(TRANSACTION_DIALOG_NAME)) {
            const dialogState = dialogs[TRANSACTION_DIALOG_NAME];
            const currentAtomicTransaction = dialogState.value as IAtomicTransaction;

            if (currentAtomicTransaction?.txid) {
                const loadedAtomicTransaction = contract.proposedTransactions.find((pt) => pt.txid === currentAtomicTransaction.txid);
                if (loadedAtomicTransaction) {
                    dispatch(mainStateActions.setDialog({ name: TRANSACTION_DIALOG_NAME, dialogState: { isOpen: dialogState.isOpen, value: loadedAtomicTransaction } }));
                }
            }
        }
    });
};

export const setIsNew: (isNew: boolean) => void = (isNew) => {
    store.dispatch(multiSigStateActions.setIsNew(isNew));
};

export const useContract = (): { contract: IMultiSigContract; isNew: boolean; isLoaded: boolean } => {
    const contract = useSelector((state: RootState) => state.multiSigState.contract);

    const isNew = useSelector((state: RootState) => state.multiSigState.isNew);
    const isLoaded = useSelector((state: RootState) => state.multiSigState.contract.scid) != null;

    return { contract, isNew, isLoaded };
};

export const updateAuthorizationGroups = (authorizationGroups: IAuthorizationGroup[]) => {
    store.dispatch(multiSigStateActions.updateAuthorizationGroups(authorizationGroups));
};

export const updateAuthorizationGroupApprovers = (authorizationGroupId: string, approvers: IApprover[]) => {
    store.dispatch(multiSigStateActions.updateAuthorizationGroupApprovers({ authorizationGroupId, approvers }));
};

export const addApproverToAuthgroup = (approver: IApprover, destinationGroup: IAuthorizationGroup, destinationIndex: number) => {
    const destinationApprovers = [...destinationGroup.approvers];
    destinationApprovers.splice(destinationIndex, 0, approver);

    store.dispatch(multiSigStateActions.updateAuthorizationGroupApprovers({ authorizationGroupId: destinationGroup.id, approvers: destinationApprovers }));
};

export const addInvolvedParty = (wallet?: IWallet) => {
    if (!wallet) {
        wallet = createWallet('');
    }
    store.dispatch(multiSigStateActions.addInvolvedParty(wallet));
    updateWallets();
};

export const deleteInvolvedParty = (id: string) => {
    store.dispatch(multiSigStateActions.deleteInvolvedParty(id));
    updateWallets();
};

export const addAuthGroup = (group?: IAuthorizationGroup) => {
    if (!group) {
        group = createAuthorizationGroup({});
    }
    store.dispatch(multiSigStateActions.addAuthGroup(group));
};

export const deleteAuthGroup = (groupId: string) => {
    store.dispatch(multiSigStateActions.deleteAuthGroup(groupId));
};

export const deleteApprover = (approverId: string) => {
    store.dispatch(multiSigStateActions.deleteApprover(approverId));
};

export const moveApproverToAuthgroup = (sourceGroup: IAuthorizationGroup, destinationGroup: IAuthorizationGroup | null, sourceIndex: number, destinationIndex: number) => {
    store.dispatch((dispatch, getState) => {
        const sourceApprovers = [...sourceGroup.approvers];
        const destinationApprovers = destinationGroup ? [...destinationGroup.approvers] : [];

        const moving = sourceApprovers[sourceIndex];
        sourceApprovers.splice(sourceIndex, 1);

        destinationApprovers.splice(destinationIndex, 0, moving);

        dispatch(multiSigStateActions.updateAuthorizationGroupApprovers({ authorizationGroupId: sourceGroup.id, approvers: sourceApprovers }));

        if (!destinationGroup) {
            destinationGroup = createAuthorizationGroup({ approvers: moving });
            dispatch(multiSigStateActions.addAuthGroup(destinationGroup));
        } else {
            dispatch(multiSigStateActions.updateAuthorizationGroupApprovers({ authorizationGroupId: destinationGroup.id, approvers: destinationApprovers }));
        }
    });
};

export const useInvolvedParties = (): [IWallet[], (involvedParties: IWallet[]) => void] => {
    const involvedParties: IWallet[] = useSelector((state: RootState) => state.multiSigState.contract.involvedParties);

    const setInvolvedParties: (involvedParties: IWallet[]) => void = (involvedParties) => {
        store.dispatch(multiSigStateActions.setInvolvedParties(involvedParties));
    };

    return [involvedParties, setInvolvedParties];
};

export const useDragStart = (): { dragStart: DragStart | null; dragStartWalletId: string | null; setDragStart: (newDragStart: DragStart | null) => void } => {
    const dragStart: DragStart | null = useSelector((state: RootState) => state.multiSigState.dragStart);
    const dragStartWalletId: string | null = useSelector((state: RootState) => state.multiSigState.dragStartWalletId);

    const setDragStart: (newDragStart: DragStart | null) => void = (newDragStart) => {
        store.dispatch(multiSigStateActions.setDragStart(newDragStart));
    };

    return { dragStart, dragStartWalletId, setDragStart };
};

export const useReorder = (): { reorder: boolean; setReorder: (newReorder: boolean) => void } => {
    const reorder: boolean = useSelector((state: RootState) => state.multiSigState.reorder);

    const setReorder = (newReorder: boolean) => {
        store.dispatch(multiSigStateActions.setReorder(newReorder));
    };

    return { reorder, setReorder };
};

export const useColorize = (): { colorize: boolean; setColorize: (newColorize: boolean) => void } => {
    const colorize: boolean = useSelector((state: RootState) => state.multiSigState.colorize);

    const setColorize = (newColorize: boolean) => {
        store.dispatch(multiSigStateActions.setColorize(newColorize));
    };

    return { colorize, setColorize };
};

export const usePreview = (): { preview: boolean; setPreview: (newPreview: boolean) => void } => {
    const preview: boolean = useSelector((state: RootState) => state.multiSigState.preview);

    const setPreview = (newPreview: boolean) => {
        store.dispatch(multiSigStateActions.setPreview(newPreview));
    };

    return { preview, setPreview };
};

export const useWallets = (): {
    wallets: IWallet[];
    setWalletHovered: (wallet: IWallet, isHovered: boolean) => void;
    setWalletColor: (wallet: IWallet, newColor: string) => void;
} => {
    const wallets = useSelector((state: RootState) => state.multiSigState.contract?.involvedParties ?? []);

    const setWalletHovered = (wallet: IWallet, isHovered: boolean) => {
        updateWallet({ ...wallet, isHovered });
    };

    const setWalletColor = (wallet: IWallet, newColor: string) => {
        wallet.color = newColor;
        updateWallet({ ...wallet, color: newColor });
    };

    return { wallets, setWalletHovered, setWalletColor };
};

export const updateWallet = (wallet: IWallet) => {
    store.dispatch((dispatch, getState) => {
        dispatch(multiSigStateActions.updateWallet(wallet));
        dispatch(mainStateActions.updateDialogMultiSigWallet(wallet));
    });
};

export const updateAuthGroup = (authGroup: IAuthorizationGroup) => {
    store.dispatch((dispatch, getState) => {
        dispatch(multiSigStateActions.updateAuthorizationGroup(authGroup));
        dispatch(mainStateActions.updateDialogMultiSigAuthorizationGroup(authGroup));
    });
};

export const setMultiSigSmartContractBalances = (balances: { [scid: Hash]: Uint64 }) => {
    store.dispatch(multiSigStateActions.setSmartContractBalances(balances));
};

export const useMultiSigSmartContractDeroBalance = () => {
    const deroBalance: Uint64 = useSelector((state: RootState) => state.multiSigState.smartContractBalances[SCID_DERO]);
    return deroBalance;
};

export const useProposedTransactions = () => {
    const atomicTransactions: IAtomicTransaction[] = useSelector((state: RootState) => state.multiSigState.contract.proposedTransactions);

    return atomicTransactions;
};

export const setMaxTransactionsInAtomic = (maxTransactions: number) => {
    store.dispatch(multiSigStateActions.setMaxTransactions(maxTransactions));
};

export const updateMultiSigContract = () => {
    const scid = store.getState().multiSigState.contract?.scid;

    if (scid) {
        loadContractAndSet(scid, false);
    }
};
