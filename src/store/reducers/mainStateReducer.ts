import { createAction, createReducer, current } from '@reduxjs/toolkit';
import { updateOnlyChangedProperties } from 'helpers/Helper';
import { WALLET_DIALOG_NAME } from 'components/MultiSigDesigner/dialogs/WalletDialog';

import { nanoid } from 'nanoid';
import _ from 'underscore';
import { CONDITION_DIALOG_NAME } from 'components/MultiSigDesigner/dialogs/ConditionsDialog';
import { STAGE_DIALOG_NAME } from 'components/GuaranteeDesigner/dialogs/StageDialog';
import LocalStorage from 'browserStorage/localStorage';

interface MainState {
    currentTab: string;
    dialogs: { [key: string]: IDialogState };
    snackbars: ISnackbar[];
    connectionType: ConnectionType;
    networkInfo: INetworkInfo | null;
    walletAddress: string | null;
    walletBalance: { [scid: string]: Uint64 };
    deroPrice: number;
    displayInUsd: boolean;
    updateFrequencyUsd: number;
    showContractVerificationAlways: boolean;
    currentTime: number;
    busyBackdrop: IBusyBackdrop;
    pendingAction: IHaloButtonUrlInvoke | null;
}

const initialState: MainState = {
    currentTab: 'MultiSignature',
    dialogs: {},
    snackbars: new Array<ISnackbar>(),
    connectionType: LocalStorage.getConnectionType(),
    networkInfo: null,
    walletAddress: null,
    walletBalance: {},
    deroPrice: -1,
    displayInUsd: LocalStorage.getDisplayInUsd(),
    updateFrequencyUsd: LocalStorage.getUsdUpdateFrequency(),
    showContractVerificationAlways: LocalStorage.getShowVerificationDialogAlways(),
    currentTime: new Date().getTime(),
    busyBackdrop: { open: false },
    pendingAction: null,
};

export const mainStateActions = {
    setCurrentTab: createAction<string>('mainStateActions/setCurrentTab'),
    addSnackbar: createAction<{ snackbar: ISnackbar }>('mainStateActions/addSnackbar'),
    removeSnackbar: createAction<string>('mainStateActions/removeSnackbar'),
    setDialog: createAction<{ name: string; dialogState: IDialogState }>('mainStateActions/setDialog'),
    setDialogOpen: createAction<{ name: string; isOpen: boolean }>('mainStateActions/setDialogOpen'),
    updateDialogMultiSigWallet: createAction<IWallet>('mainStateActions/updateDialogMultiSigWallet'),
    updateDialogMultiSigAuthorizationGroup: createAction<IAuthorizationGroup>('mainStateActions/updateDialogMultiSigAuthorizationGroup'),
    updateDialogGuaranteeStage: createAction<IStage>('mainStateActions/updateDialogGuaranteeStage'),
    setConnectionType: createAction<ConnectionType>('mainStateActions/setConnectionType'),
    setNetworkInfo: createAction<{ networkInfo: INetworkInfo | null }>('mainStateActions/setNetworkInfo'),
    setTopoheight: createAction<number>('mainStateActions/setTopoheight'),
    setWalletAddress: createAction<string | null>('mainStateActions/setWalletAddress'),
    setWalletBalance: createAction<{ walletBalance?: IWalletBalance; clearOthers?: boolean }>('mainStateActions/setWalletBalance'),
    setDeroPrice: createAction<number>('mainStateActions/setDeroPrice'),
    setDisplayInUsd: createAction<boolean>('mainStateActions/setDisplayInUsd'),
    setUpdateFrequencyUsd: createAction<number>('mainStateActions/setUpdateFrequencyUsd'),
    setShowContractVerificationAlways: createAction<boolean>('mainStateActions/setShowContractVerificationAlways'),
    updateCurrentTime: createAction('mainStateActions/updateCurrentTime'),
    setBusyBackdrop: createAction<IBusyBackdrop>('mainStateActions/setBusyDialog'),
    setPendingAction: createAction<IHaloButtonUrlInvoke | null>('mainStateActions/setPendingAction'),
};

export const mainStateReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(mainStateActions.setCurrentTab, (state, action) => {
            state.currentTab = action.payload;
        })
        .addCase(mainStateActions.addSnackbar, (state, action) => {
            const { snackbar } = action.payload;
            state.snackbars.push({ id: nanoid(), ...snackbar });
        })
        .addCase(mainStateActions.removeSnackbar, (state, action) => {
            state.snackbars = state.snackbars.filter((snackbar) => snackbar.id != action.payload);
        })
        .addCase(mainStateActions.setDialog, (state, action) => {
            const { name, dialogState } = action.payload;
            state.dialogs[name] = dialogState;
        })
        .addCase(mainStateActions.setDialogOpen, (state, action) => {
            const { name, isOpen } = action.payload;
            if (state.dialogs[name]) {
                if (state.dialogs[name].isOpen !== isOpen) state.dialogs[name].isOpen = isOpen;
            } else {
                state.dialogs[name] = { isOpen };
            }
        })
        .addCase(mainStateActions.updateDialogMultiSigWallet, (state, action) => {
            const wallet = action.payload;
            const currentWallet = state.dialogs[WALLET_DIALOG_NAME]?.value?.wallet;
            if (currentWallet && currentWallet.id === wallet.id) {
                updateOnlyChangedProperties(currentWallet, wallet);
            }
        })
        .addCase(mainStateActions.updateDialogMultiSigAuthorizationGroup, (state, action) => {
            const authorizationGroup = action.payload;
            const currentAuthorizationGroup = state.dialogs[CONDITION_DIALOG_NAME]?.value;
            if (currentAuthorizationGroup && currentAuthorizationGroup.id === authorizationGroup.id) {
                updateOnlyChangedProperties(currentAuthorizationGroup, authorizationGroup);
            }
        })
        .addCase(mainStateActions.updateDialogGuaranteeStage, (state, action) => {
            const stage = action.payload;
            const currentStage = state.dialogs[STAGE_DIALOG_NAME]?.value;
            if (currentStage && currentStage.id === stage.id) {
                updateOnlyChangedProperties(currentStage, stage);
            }
        })
        .addCase(mainStateActions.setConnectionType, (state, action) => {
            const connectionType = action.payload;
            if (!_.isEqual(state.connectionType, connectionType)) state.connectionType = connectionType;
        })
        .addCase(mainStateActions.setNetworkInfo, (state, action) => {
            const { networkInfo } = action.payload;
            if (!networkInfo) {
                state.networkInfo = null;
            } else {
                if (state.networkInfo) {
                    if (state.networkInfo.height != networkInfo.height) state.networkInfo.height = networkInfo.height;
                    if (state.networkInfo.testnet != networkInfo.testnet) state.networkInfo.testnet = networkInfo.testnet;
                    if (state.networkInfo.averageblocktime50 != networkInfo.averageblocktime50) state.networkInfo.averageblocktime50 = networkInfo.averageblocktime50;
                } else {
                    state.networkInfo = networkInfo;
                }
            }
        })
        .addCase(mainStateActions.setTopoheight, (state, action) => {
            const topoheight = action.payload;
            if (state.networkInfo) {
                state.networkInfo.topoheight = topoheight;
            } else {
                state.networkInfo = { topoheight } as INetworkInfo;
            }
        })
        .addCase(mainStateActions.setWalletAddress, (state, action) => {
            const walletAddress = action.payload;
            state.walletAddress = walletAddress;
        })
        .addCase(mainStateActions.setWalletBalance, (state, action) => {
            const { walletBalance, clearOthers = false } = action.payload;
            if (clearOthers) {
                state.walletBalance = {};
            }

            if (walletBalance) {
                state.walletBalance[walletBalance.scid] = walletBalance.balance;
            }
        })
        .addCase(mainStateActions.setDeroPrice, (state, action) => {
            const deroPrice = action.payload;
            if (state.deroPrice != deroPrice) state.deroPrice = deroPrice;
        })
        .addCase(mainStateActions.setDisplayInUsd, (state, action) => {
            const displayInUsd = action.payload;
            if (state.displayInUsd != displayInUsd) state.displayInUsd = displayInUsd;
        })
        .addCase(mainStateActions.setUpdateFrequencyUsd, (state, action) => {
            const updateFrequencyUsd = action.payload;
            if (state.updateFrequencyUsd != updateFrequencyUsd) state.updateFrequencyUsd = updateFrequencyUsd;
        })
        .addCase(mainStateActions.setShowContractVerificationAlways, (state, action) => {
            const showContractVerificationAlways = action.payload;
            state.showContractVerificationAlways = showContractVerificationAlways;
        })
        .addCase(mainStateActions.updateCurrentTime, (state, action) => {
            state.currentTime = new Date().getTime();
        })
        .addCase(mainStateActions.setBusyBackdrop, (state, action) => {
            const newBusyBackdrop = action.payload;
            state.busyBackdrop = newBusyBackdrop;
        })
        .addCase(mainStateActions.setPendingAction, (state, action) => {
            const pendingAction = action.payload;
            state.pendingAction = pendingAction;
        });
});
