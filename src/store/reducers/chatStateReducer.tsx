import { createAction, createReducer, current } from '@reduxjs/toolkit';
import { createNewGuaranteeContract } from '../../helpers/ContractHelper';
import { createSmartContractCode, createStats, reassignColors } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { DUMMY_GUARANTEE, DUMMY_GUARANTEE_STATS, SCID_DERO } from 'Constants';
import { getNewChatFor } from 'helpers/ChatHelper';

interface IChatState {
    currentChat: number | null;
    currentChatMinimum: Uint64;
    chats: IChat[];
    isLoading: boolean;
    lastCheckedBlock: Uint64;
}

const initialState: IChatState = {
    currentChat: null,
    currentChatMinimum: 0,
    chats: [],
    isLoading: false,
    lastCheckedBlock: -1,
};

export const chatStateActions = {
    setCurrentChat: createAction<number | null>('chatStateActions/setCurrentChat'),
    setCurrentChatMinimum: createAction<number>('chatStateActions/setCurrentChatMinimum'),
    setChats: createAction<IChat[]>('chatStateActions/setChats'),
    addChat: createAction<{ chat: IChat; setAsCurrent: boolean }>('chatStateActions/addChat'),
    addOrUpdateChatWithWalletDirectoryEntry: createAction<{ wde: IWalletDirectoryEntry; setAsCurrent: boolean }>('chatStateActions/addOrUpdateChatWithWalletDirectoryEntry'),
    addChatMessage: createAction<{ chatMessage: IChatMessage; wde?: IWalletDirectoryEntry }>('chatStateActions/addChatMessage'),
    updateTransferTransaction: createAction<{
        otherParty: string;
        tempId: string;
        transactionTempId: string;
        txid: string | null;
        blockheight: number | null;
        state: ChatTransactionState;
        stateText?: string;
    }>('chatStateActions/updateTransferTransaction'),
    setIsLoading: createAction<boolean>('chatStateActions/setIsLoading'),
    setLastCheckedBlock: createAction<number>('chatStateActions/setLastCheckedBlock'),
};

export const chatStateReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(chatStateActions.setCurrentChat, (state, action) => {
            state.currentChat = action.payload;
        })
        .addCase(chatStateActions.setCurrentChatMinimum, (state, action) => {
            state.currentChatMinimum = action.payload;
        })
        .addCase(chatStateActions.setChats, (state, action) => {
            state.chats = action.payload;
            sortChats(state);
        })
        .addCase(chatStateActions.addChat, (state, action) => {
            const { chat: newChat, setAsCurrent } = action.payload;

            const existingChat = state.chats.find((chat) => chat.otherParty?.address === newChat.otherParty?.address);
            if (existingChat && newChat.otherParty) {
                if (newChat.otherParty.alias) existingChat.otherParty!.alias = newChat?.otherParty?.alias;
                if (setAsCurrent) {
                    const index = state.chats.findIndex((chat) => chat.otherParty?.address === newChat.otherParty!.address);
                    state.currentChat = index;
                }
                sortChats(state);
                return;
            }

            state.chats.push(newChat);
            if (setAsCurrent) {
                state.currentChat = state.chats.length - 1;
            }
            sortChats(state);
        })
        .addCase(chatStateActions.addOrUpdateChatWithWalletDirectoryEntry, (state, action) => {
            const { wde, setAsCurrent } = action.payload;

            updateAliasForChatMessagesInAllChat(state, wde);

            const existingChat = state.chats.find((chat) => chat.otherParty?.address === wde.address);
            if (existingChat) {
                existingChat.otherParty = wde;
                if (setAsCurrent) {
                    const index = state.chats.findIndex((chat) => chat.otherParty?.address === wde.address);
                    state.currentChat = index;
                }
                sortChats(state);
                return;
            }

            const newChat = getNewChatFor(wde);
            state.chats.push(newChat);
            if (setAsCurrent) {
                state.currentChat = state.chats.length - 1;
            }
            sortChats(state);
        })
        .addCase(chatStateActions.addChatMessage, (state, action) => {
            const { chatMessage, wde } = action.payload;
            addChatMessage(state, chatMessage, wde);
            sortChats(state);
        })
        .addCase(chatStateActions.updateTransferTransaction, (state, action) => {
            const { otherParty, tempId, transactionTempId, txid, blockheight, state: transferTransactionState, stateText } = action.payload;

            state.chats
                .filter((chat) => chat.otherParty === null || chat.otherParty?.address === otherParty)
                .forEach((chat) => {
                    const chatMessage = chat.messages.find((chatMessage) => chatMessage.tempId === tempId) as IChatMessage | null;

                    if (chatMessage) {
                        const transaction = chatMessage.transactions.find((t) => t.transactionTempId === transactionTempId);

                        if (transaction) {
                            transaction.state = transferTransactionState;
                            transaction.stateText = stateText;

                            if (txid) transaction.txid = txid;
                            if (blockheight) {
                                if (transaction.startPart == 0 || transaction.startPart === undefined) {
                                    chatMessage.blockheight = blockheight;
                                    chatMessage.blockheight_id = `${blockheight}_${chatMessage.id}`;
                                }
                            }

                            if (transaction.startPart && transaction.endPart) {
                                for (let a = transaction.startPart; a <= transaction.endPart; a++) {
                                    const chatPiece = chatMessage.chatPieces[a];
                                    chatPiece.state = transferTransactionState;
                                }
                            }
                        }
                    }
                });
        })
        .addCase(chatStateActions.setIsLoading, (state, action) => {
            state.isLoading = action.payload;
        })
        .addCase(chatStateActions.setLastCheckedBlock, (state, action) => {
            state.lastCheckedBlock = action.payload;
        });
});

const addChatMessage = (state: IChatState, chatMessage: IChatMessage, wde?: IWalletDirectoryEntry) => {
    if (state.chats.every((chat) => chat.otherParty?.address !== chatMessage.otherParty)) {
        state.chats.push(getNewChatFor(wde ?? chatMessage.otherParty));
    }
    if (!checkIfAlreadyShows(state, chatMessage)) {
        state.chats
            .filter((chat) => !chat.otherParty || chat.otherParty.address === chatMessage.otherParty)
            .forEach((chat) => {
                chat.messages.push(chatMessage);
                calculateTotals(chat);
            });
    }
};

const checkIfAlreadyShows = (state: IChatState, newChatMessage: IChatMessage) => {
    const chatAll = state.chats.find((chat) => chat.otherParty === null);

    const chatDestination = state.chats.find((chat) => chat.otherParty?.address === newChatMessage.otherParty);

    let found = false;
    if (chatAll) {
        const foundMessage = findMessage(chatAll, newChatMessage);
        if (foundMessage) {
            found = true;
            if (chatDestination) {
                findMessage(chatDestination, newChatMessage);
            } else {
                return false;
            }
        }
    }

    return found;
};

const findMessage = (chat: IChat, newChatMessage: IChatMessage) => {
    if (newChatMessage.type === 'text/plain') {
        const found = chat.messages.some((chatMessage) => {
            if (!chatMessage.blockheight || chatMessage.blockheight === newChatMessage.blockheight) {
                if (chatMessage.type === newChatMessage.type && chatMessage.content == newChatMessage.content) {
                    chatMessage.blockheight = newChatMessage.blockheight;
                    chatMessage.time = newChatMessage.time;
                    chatMessage.blockheight_id = `${newChatMessage.blockheight}_${chatMessage.id}`;
                    return true;
                }
                return false;
            }
        });
        return found;
    } else {
        const found = chat.messages.some((chatMessage) => {
            if (!chatMessage.blockheight || chatMessage.blockheight === newChatMessage.blockheight) {
                if (chatMessage.type === newChatMessage.type && chatMessage.content == newChatMessage.content) {
                    chatMessage.blockheight = newChatMessage.blockheight;
                    chatMessage.time = newChatMessage.time;
                    chatMessage.blockheight_id = `${newChatMessage.blockheight}_${chatMessage.id}`;
                    return true;
                }
                return false;
            }
        });
        return found;
    }
    return null;
};

const calculateTotals = (chat: IChat) => {
    chat.receivedMinAmount = -1;
    chat.receivedMaxAmount = 0;
    chat.sentMinAmount = -1;
    chat.sentMaxAmount = 0;
    chat.totalReceived = 0;
    chat.totalSent = 0;
    chat.messages.forEach((chatMessage) => {
        if (chatMessage.wasReceived) {
            chat.totalReceived += chatMessage.amountSent;
            if (chatMessage.amountSent < chat.receivedMinAmount || chat.receivedMinAmount === -1) {
                chat.receivedMinAmount = chatMessage.amountSent;
            }
            if (chatMessage.amountSent > chat.receivedMaxAmount) {
                chat.receivedMaxAmount = chatMessage.amountSent;
            }
        } else {
            chat.totalSent += chatMessage.amountSent;
            if (chatMessage.amountSent < chat.sentMinAmount || chat.sentMinAmount === -1) {
                chat.sentMinAmount = chatMessage.amountSent;
            }
            if (chatMessage.amountSent > chat.sentMaxAmount) {
                chat.sentMaxAmount = chatMessage.amountSent;
            }
        }
    });
    if (chat.receivedMinAmount === -1) chat.receivedMinAmount = 0;
    if (chat.sentMinAmount === -1) chat.sentMinAmount = 0;
};

const updateAliasForChatMessagesInAllChat = (state: IChatState, wde: IWalletDirectoryEntry) => {
    if (state.chats.length === 0) return;
    state.chats[0].messages.forEach((chatMessage) => {
        if (chatMessage.otherParty === wde.address && chatMessage.otherPartyAlias != wde.alias) {
            chatMessage.otherPartyAlias = wde.alias;
        }
    });
};

const sortChats = (state: IChatState) => {};
