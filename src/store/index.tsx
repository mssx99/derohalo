import { configureStore } from '@reduxjs/toolkit';
import { mainStateReducer } from './reducers/mainStateReducer';
import { multiSigStateReducer } from './reducers/multiSigStateReducer';
import { guaranteeStateReducer } from './reducers/guaranteeStateReducer';
import { directoryStateReducer } from './reducers/directoryStateReducer';
import { chatStateReducer } from './reducers/chatStateReducer';
import { webStateReducer } from './reducers/webStateReducer';

const store = configureStore({
    reducer: {
        mainState: mainStateReducer,
        multiSigState: multiSigStateReducer,
        guaranteeState: guaranteeStateReducer,
        directoryState: directoryStateReducer,
        chatState: chatStateReducer,
        webState: webStateReducer,
    },
    devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;

export default store;
