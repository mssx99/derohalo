import { useSelector } from 'react-redux';
import store, { RootState } from 'store';
import { chatStateActions } from 'store/reducers/chatStateReducer';

export const setCurrentChat = ({ address, index }: { address?: string; index?: number }) => {
    if (index !== undefined) {
        store.dispatch(chatStateActions.setCurrentChat(index));
        return;
    }
    if (address) {
        index = store.getState().chatState.chats.findIndex((chat) => chat?.otherParty?.address === address);
        if (index > -1) {
            store.dispatch(chatStateActions.setCurrentChat(index));
        } else {
        }
        return;
    }
};

export const useCurrentChatIndex = () => {
    const currentChatIndex = useSelector((state: RootState) => state.chatState.currentChat);
    return currentChatIndex;
};

export const useCurrentChat = () => {
    const currentChat = useSelector((state: RootState) => (state.chatState.currentChat != null ? state.chatState.chats[state.chatState.currentChat] : null));
    return currentChat;
};

export const useCurrentChatOtherParty = () => {
    const currentChat = useCurrentChat();
    if (currentChat) {
        return currentChat.otherParty;
    }
    return null;
};

export const setCurrentChatMinimum = (chatMinimum: Uint64) => {
    store.dispatch(chatStateActions.setCurrentChatMinimum(chatMinimum));
};

export const useCurrentChatMinimum = () => {
    const currentChatMinimum = useSelector((state: RootState) => state.chatState.currentChatMinimum);
    return currentChatMinimum;
};

export const useChats = () => {
    const chats = useSelector((state: RootState) => state.chatState.chats);
    return chats;
};

export const addChat = (chat: IChat, setAsCurrent: boolean = false) => {
    store.dispatch(chatStateActions.addChat({ chat, setAsCurrent }));
};

export const addOrUpdateChatWithWalletDirectoryEntry = (wde: IWalletDirectoryEntry, setAsCurrent: boolean = false) => {
    store.dispatch(chatStateActions.addOrUpdateChatWithWalletDirectoryEntry({ wde, setAsCurrent }));
};

export const addChatMessage = (chatMessage: IChatMessage) => {
    store.dispatch((dispatch, getState) => {
        const foundWde = getState().directoryState.entriesWallet.find((entry) => entry.address === chatMessage.otherParty);
        if (foundWde) {
            chatMessage.otherPartyAlias = foundWde.alias;
        }
        dispatch(chatStateActions.addChatMessage({ chatMessage, wde: foundWde }));
    });
};

export const updateTransferTransaction = (
    otherParty: string,
    tempId: string,
    transactionTempId: string,
    txid: string | null,
    blockheight: number | null,
    state: ChatTransactionState,
    stateText?: string
) => {
    store.dispatch(chatStateActions.updateTransferTransaction({ otherParty, tempId, transactionTempId, txid, blockheight, state, stateText }));
};

export const getIsLoading = () => {
    return store.getState().chatState.isLoading;
};

export const setIsLoading = (isLoading: boolean) => {
    store.dispatch(chatStateActions.setIsLoading(isLoading));
};

export const getLastCheckedBlock = () => {
    return store.getState().chatState.lastCheckedBlock;
};

export const setLastCheckedBlock = (lastCheckedBlock: number) => {
    store.dispatch(chatStateActions.setLastCheckedBlock(lastCheckedBlock));
};

export const useLastCheckedBlock = () => {
    const lastCheckedBlock = useSelector((state: RootState) => state.chatState.lastCheckedBlock);
    return lastCheckedBlock;
};
