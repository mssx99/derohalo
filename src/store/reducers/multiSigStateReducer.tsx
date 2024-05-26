import { createAction, createReducer, current } from '@reduxjs/toolkit';
import { DragStart } from 'react-beautiful-dnd';
import { createNewMultiSigContract } from '../../helpers/ContractHelper';
import { updateOnlyChangedProperties } from 'helpers/Helper';
import { createSmartContractCode, reassignColors } from 'helpers/MultiSig/MultiSigSmartContractHelper';
import { DUMMY_MULTISIG, SCID_DERO } from 'Constants';

interface MultiSigState {
    isNew: boolean;
    contract: IMultiSigContract;
    dragStart: DragStart | null;
    dragStartWalletId: string | null;
    reorder: boolean;
    colorize: boolean;
    preview: boolean;
    smartContractBalances: { [key: string]: Uint64 };
}

const initialState: MultiSigState = {
    isNew: true,
    contract: DUMMY_MULTISIG,
    dragStart: null,
    dragStartWalletId: null,
    reorder: false,
    colorize: false,
    preview: true,
    smartContractBalances: {},
};

export const multiSigStateActions = {
    setIsNew: createAction<boolean>('multiSigStateActions/setIsNew'),
    setContract: createAction<IMultiSigContract>('multiSigStateActions/setContract'),
    setDragStart: createAction<DragStart | null>('multiSigStateActions/setDragStart'),
    addInvolvedParty: createAction<IWallet>('multiSigStateActions/addInvolvedParty'),
    deleteInvolvedParty: createAction<string>('multiSigStateActions/deleteInvolvedParty'),
    updateWallet: createAction<IWallet>('multiSigStateActions/updateWallet'),
    addAuthGroup: createAction<IAuthorizationGroup>('multiSigStateActions/addAuthGroup'),
    deleteAuthGroup: createAction<string>('multiSigStateActions/deleteAuthGroup'),
    deleteApprover: createAction<string>('multiSigStateActions/deleteApprover'),
    updateAuthorizationGroup: createAction<IAuthorizationGroup>('multiSigStateActions/updateAuthorizationGroup'),
    updateAuthorizationGroups: createAction<IAuthorizationGroup[]>('multiSigStateActions/updateAuthorizationGroups'),
    updateAuthorizationGroupApprovers: createAction<{ authorizationGroupId: string; approvers: IApprover[] }>('multiSigStateActions/updateAuthorizationGroupApprovers'),
    setInvolvedParties: createAction<IWallet[]>('multiSigStateActions/setInvolvedParties'),
    setReorder: createAction<boolean>('multiSigStateActions/setReorder'),
    setColorize: createAction<boolean>('multiSigStateActions/setColorize'),
    setPreview: createAction<boolean>('multiSigStateActions/setPreview'),
    setWalletHovered: createAction<{ walletId: string; isHovered: boolean }>('multiSigStateActions/setWalletHovered'),
    setWalletColor: createAction<{ walletId: string; newColor: string }>('multiSigStateActions/setWalletColor'),
    setSmartContractBalances: createAction<number | { [key: string]: Uint64 }>('multiSigStateActions/setSmartContractBalances'),
    setMaxTransactions: createAction<number>('multiSigStateActions/setMaxTransactions'),
};

export const multiSigStateReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(multiSigStateActions.setIsNew, (state, action) => {
            state.isNew = action.payload;
        })
        .addCase(multiSigStateActions.setContract, (state, action) => {
            const contract = action.payload;
            state.contract = contract;
            state.isNew = contract.scid ? false : true;
            if (state.isNew) {
                refreshCode(contract);
            }
        })
        .addCase(multiSigStateActions.setDragStart, (state, action) => {
            const dragStart = action.payload;
            state.dragStart = action.payload;
            let walletId = null;
            const droppableId = dragStart?.source?.droppableId;
            if (droppableId !== null && droppableId !== 'INVOLVED_PARTIES') {
                const authGroup = state.contract.authorizationGroups.find((ag) => `authDroppable_${ag.id}` === droppableId);
                if (authGroup && dragStart!.source.index < authGroup.approvers.length) {
                    walletId = authGroup.approvers[dragStart!.source.index].wallet.id;
                }
            } else if (droppableId !== null && droppableId === 'INVOLVED_PARTIES') {
                if (dragStart!.source.index < state.contract.involvedParties.length) {
                    walletId = state.contract.involvedParties[dragStart!.source.index].id;
                }
            }
            state.dragStartWalletId = walletId;
        })
        .addCase(multiSigStateActions.addInvolvedParty, (state, action) => {
            state.contract.involvedParties.push(action.payload);
            reassignColors(state.contract);
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.deleteInvolvedParty, (state, action) => {
            const walletId = action.payload;
            state.contract.involvedParties = state.contract.involvedParties.filter((ip) => ip.id !== walletId);
            state.contract.authorizationGroups.forEach((ag) => {
                ag.approvers = ag.approvers.filter((ap) => ap.wallet.id !== walletId);
            });
            reassignColors(state.contract);
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.updateWallet, (state, action) => {
            const wallet = action.payload;
            updateAllWallets(state, wallet);
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.addAuthGroup, (state, action) => {
            state.contract.authorizationGroups.push(action.payload);
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.deleteAuthGroup, (state, action) => {
            const id = action.payload;
            state.contract.authorizationGroups = state.contract.authorizationGroups.filter((ag) => ag.id !== id);
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.deleteApprover, (state, action) => {
            const approverId = action.payload;
            state.contract.authorizationGroups.forEach((ag) => {
                ag.approvers = ag.approvers.filter((ap) => ap.id !== approverId);
            });
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.updateAuthorizationGroup, (state, action) => {
            const updatedAuthorizationGroup = action.payload;

            const authGroupIndex = state.contract.authorizationGroups.findIndex((ag) => ag.id === updatedAuthorizationGroup.id);

            if (authGroupIndex > -1) {
                state.contract.authorizationGroups[authGroupIndex] = updatedAuthorizationGroup;
            } else {
                state.contract.authorizationGroups.push(updatedAuthorizationGroup);
            }
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.updateAuthorizationGroups, (state, action) => {
            state.contract.authorizationGroups = action.payload;
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.updateAuthorizationGroupApprovers, (state, action) => {
            const { authorizationGroupId, approvers } = action.payload;
            const authorizationGroup = state.contract.authorizationGroups.find((ag) => ag.id === authorizationGroupId);
            if (authorizationGroup) authorizationGroup.approvers = approvers;
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.setInvolvedParties, (state, action) => {
            state.contract.involvedParties = action.payload;
            refreshCode(state.contract);
        })
        .addCase(multiSigStateActions.setReorder, (state, action) => {
            state.reorder = action.payload;
        })
        .addCase(multiSigStateActions.setColorize, (state, action) => {
            state.colorize = action.payload;
        })
        .addCase(multiSigStateActions.setPreview, (state, action) => {
            state.preview = action.payload;
        })
        .addCase(multiSigStateActions.setSmartContractBalances, (state, action) => {
            if (typeof action.payload === 'object') {
                const balances = action.payload as { [key: string]: Uint64 };
                state.smartContractBalances = balances;
            } else {
                const balance = action.payload as Uint64;
                state.smartContractBalances = { ...state.smartContractBalances };
                state.smartContractBalances[SCID_DERO] = balance;
            }
        })
        .addCase(multiSigStateActions.setMaxTransactions, (state, action) => {
            const newMaxTransactions = action.payload;
            state.contract.maxTransactionsInAtomic = action.payload;
            refreshCode(state.contract);
        });
});

const refreshCode = (contract: IMultiSigContract) => {
    contract.code = createSmartContractCode(contract);
};

const updateAllWallets = (state: MultiSigState, wallet: IWallet) => {
    const index = state.contract.involvedParties.findIndex((w) => w.id === wallet.id);
    updateOnlyChangedProperties(state.contract.involvedParties[index], wallet);
    state.contract.authorizationGroups.forEach((ag) => {
        ag.approvers.forEach((approver) => {
            const walletApprover = approver.wallet;
            if (walletApprover.id === wallet.id) {
                updateOnlyChangedProperties(walletApprover, wallet);
            }
        });
    });
};
