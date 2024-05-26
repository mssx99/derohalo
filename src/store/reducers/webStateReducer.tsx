import { createAction, createReducer, current } from '@reduxjs/toolkit';
import { SCID_DERO } from 'Constants';

interface IWebState {
    contract: IWebContract | null;
    smartContractBalances: { [key: string]: Uint64 };
}

const initialState: IWebState = {
    contract: null,
    smartContractBalances: {},
};

export const webStateActions = {
    setContract: createAction<IWebContract>('webStateActions/setContract'),
    setSmartContractBalances: createAction<number | { [key: string]: Uint64 }>('webStateActions/setSmartContractBalances'),
    updateListing: createAction<IListing>('webStateActions/updateListing'),
};

export const webStateReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(webStateActions.setContract, (state, action) => {
            state.contract = action.payload;
        })
        .addCase(webStateActions.setSmartContractBalances, (state, action) => {
            if (typeof action.payload === 'object') {
                const balances = action.payload as { [key: string]: Uint64 };
                state.smartContractBalances = balances;
            } else {
                const balance = action.payload as Uint64;
                state.smartContractBalances = { ...state.smartContractBalances };
                state.smartContractBalances[SCID_DERO] = balance;
            }
        })
        .addCase(webStateActions.updateListing, (state, action) => {
            const listing = action.payload;
            if (!state.contract) return;
            state.contract.listings[listing.listingKey] = { ...listing };
        });
});
