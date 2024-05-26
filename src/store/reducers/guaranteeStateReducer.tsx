import { createAction, createReducer, current } from '@reduxjs/toolkit';
import { createNewGuaranteeContract } from '../../helpers/ContractHelper';
import { createSmartContractCode, createStats, reassignColors } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { DUMMY_GUARANTEE, DUMMY_GUARANTEE_STATS, SCID_DERO } from 'Constants';

interface GuaranteeState {
    isNew: boolean;
    contract: IGuaranteeContract;
    guaranteeStats: IGuaranteeStats;
    preview: boolean;
    showArrows: boolean;
    displayBlocks: boolean;
    smartContractBalances: { [key: string]: Uint64 };
}

const initialState: GuaranteeState = {
    isNew: true,
    contract: DUMMY_GUARANTEE,
    guaranteeStats: DUMMY_GUARANTEE_STATS,
    preview: true,
    showArrows: false,
    displayBlocks: false,
    smartContractBalances: {},
};

export const guaranteeStateActions = {
    setIsNew: createAction<boolean>('guaranteeStateActions/setIsNew'),
    setContract: createAction<{ contract: IGuaranteeContract; currentBlockheight: Uint64 }>('guaranteeStateActions/setContract'),
    setPreview: createAction<boolean>('guaranteeStateActions/setPreview'),
    setShowArrows: createAction<boolean>('guaranteeStateActions/setShowArrows'),
    setDisplayBlocks: createAction<boolean>('guaranteeStateActions/setDisplayBlocks'),
    setSmartContractBalances: createAction<number | { [key: string]: Uint64 }>('guaranteeStateActions/setSmartContractBalances'),
    setDescription: createAction<string>('guaranteeStateActions/setDescription'),
    setFirstPartyWallet: createAction<IWallet>('guaranteeStateActions/setFirstPartyWallet'),
    setSecondPartyWallet: createAction<IWallet>('guaranteeStateActions/setSecondPartyWallet'),
    addStage: createAction<{ stage: IStage; currentBlockheight: Uint64 }>('guaranteeStateActions/addStage'),
    deleteStage: createAction<{ deleteRenderId: string; currentBlockheight: Uint64 }>('guaranteeStateActions/deleteStage'),
    updateStage: createAction<{ stage: IStage; currentBlockheight: Uint64 }>('guaranteeStateActions/updateStage'),
    setStages: createAction<{ stages: IStage[]; currentBlockheight: Uint64 }>('guaranteeStateActions/setStages'),
};

export const guaranteeStateReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(guaranteeStateActions.setIsNew, (state, action) => {
            state.isNew = action.payload;
        })
        .addCase(guaranteeStateActions.setContract, (state, action) => {
            const { contract, currentBlockheight } = action.payload;
            state.contract = contract;
            state.isNew = contract.scid ? false : true;
            if (state.isNew) {
                refreshCode(contract);
            }
            refreshStats(state, currentBlockheight);
        })
        .addCase(guaranteeStateActions.setPreview, (state, action) => {
            state.preview = action.payload;
        })
        .addCase(guaranteeStateActions.setShowArrows, (state, action) => {
            state.showArrows = action.payload;
        })
        .addCase(guaranteeStateActions.setDisplayBlocks, (state, action) => {
            state.displayBlocks = action.payload;
        })
        .addCase(guaranteeStateActions.setSmartContractBalances, (state, action) => {
            if (typeof action.payload === 'object') {
                const balances = action.payload as { [key: string]: Uint64 };
                state.smartContractBalances = balances;
            } else {
                const balance = action.payload as Uint64;
                state.smartContractBalances = { ...state.smartContractBalances };
                state.smartContractBalances[SCID_DERO] = balance;
            }
        })
        .addCase(guaranteeStateActions.setDescription, (state, action) => {
            const newDescription = action.payload;
            state.contract.description = newDescription;
            refreshCode(state.contract);
        })
        .addCase(guaranteeStateActions.setFirstPartyWallet, (state, action) => {
            const newWallet = action.payload;
            state.contract.firstPartyWallet = newWallet;
            refreshCode(state.contract);
        })
        .addCase(guaranteeStateActions.setSecondPartyWallet, (state, action) => {
            const newWallet = action.payload;
            state.contract.secondPartyWallet = newWallet;
            refreshCode(state.contract);
        })
        .addCase(guaranteeStateActions.addStage, (state, action) => {
            const { stage: newStage, currentBlockheight } = action.payload;
            newStage.id = state.contract.stages.length + 1;
            state.contract.stages = [...state.contract.stages, newStage];

            refreshStats(state, currentBlockheight);
            reassignColors(state.contract);
            refreshCode(state.contract);
        })
        .addCase(guaranteeStateActions.updateStage, (state, action) => {
            const { stage: updatedStage, currentBlockheight } = action.payload;
            state.contract.stages = state.contract.stages.reduce((acc, s) => {
                if (s.renderId != updatedStage.renderId) {
                    acc.push(s);
                } else {
                    acc.push(updatedStage);
                }
                return acc;
            }, new Array<IStage>());

            refreshStats(state, currentBlockheight);
            refreshCode(state.contract);
        })
        .addCase(guaranteeStateActions.deleteStage, (state, action) => {
            const { deleteRenderId, currentBlockheight } = action.payload;
            const deleteId = state.contract.stages.find((s) => s.renderId == deleteRenderId)!.id;

            state.contract.stages = state.contract.stages.reduce((acc, s) => {
                if (s.renderId != deleteRenderId) {
                    if (s.id > deleteId) {
                        s.id--;
                    }
                    if (s.offsetTo && s.offsetTo === deleteId) {
                        s.offsetTo = undefined;
                        s.blocks = 0;
                    } else if (s.offsetTo && s.offsetTo > deleteId) {
                        s.offsetTo--;
                    }
                    acc.push(s);
                }
                return acc;
            }, new Array<IStage>());

            refreshStats(state, currentBlockheight);
            reassignColors(state.contract);
            refreshCode(state.contract);
        })
        .addCase(guaranteeStateActions.setStages, (state, action) => {
            const { stages, currentBlockheight } = action.payload;
            state.contract.stages = stages;

            refreshStats(state, currentBlockheight);
            refreshCode(state.contract);
        });
});

const refreshStats = (state: GuaranteeState, currentBlockheight: Uint64) => {
    const stats = createStats(state.contract, currentBlockheight);
    state.guaranteeStats = stats;
};

const refreshCode = (contract: IGuaranteeContract) => {
    contract.code = createSmartContractCode(contract);
};
