import { MAX_TRANSFERS, MESSAGE_SEVERITY, XSWD_DEFAULTPORT } from 'Constants';
import { addChat, addChatMessage, getIsLoading, getLastCheckedBlock, setCurrentChat, setIsLoading, setLastCheckedBlock, updateTransferTransaction } from 'hooks/chatHooks';
import { nanoid } from 'nanoid';
import store from 'store';
import { waitForTransaction } from './DeroHelper';
import { CHAT_SCROLL_TO_BOTTOM } from 'components/Chat/ChatMessages/DisplayMessages';
import { getDeroInterface, updateWalletBalance } from 'hooks/deroHooks';
import { getXswdPort, setCurrentTab } from 'hooks/mainHooks';
import { isWalletDirectoryEntry } from './DirectoryHelper';
import { addSnackbar } from 'components/screen/Snackbars';
import LocalStorage from 'browserStorage/localStorage';
import { goToLink } from './Helper';

export const prepareChats = () => {
    addChat({
        otherParty: null,
        startBlock: 0,
        lastBlock: -1,
        minAmountOtherParty: 0,
        minAmountForDisplay: 0,
        receivedMinAmount: 0,
        receivedMaxAmount: 0,
        sentMinAmount: 0,
        sentMaxAmount: 0,
        totalReceived: 0,
        totalSent: 0,
        messages: [],
    } as IChat);
    setCurrentChat({ index: 0 });
};

interface IChatSend {
    destination: Hash;
    text?: string;
    amountPerTransfer: Uint64;
    binaryBase64?: string;
    binaryMimeType: string;
}

export const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
    let result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
};

export const chatSendBinary = async ({ destination, text, amountPerTransfer, binaryBase64, binaryMimeType }: IChatSend) => {
    // D = DATA
    // I = ID (Random Number from 0 to 255 in case that another message is sent from somewhere in the same block)

    /**
     * 150 bytes==> first 8-bit (0-255) id next 8-bit (0-255) part I=(id/part)
        if(>65535) startmessage with count I=(id/part/count/type)

        if(I) is not present simple message (only C)
     */

    const ringsize = 2;

    if (text) {
        if (text.length < NET_PAYLOAD_SINGLE) {
            const transferParams: ITransferParams = { transfers: [{ destination, amount: amountPerTransfer, payload_rpc: [{ name: CHAT_DATA, datatype: 'S', value: text }] }], ringsize };
            return await getDeroInterface().transfer(transferParams);
        } else {
            const deroChatPieces = getDeroChatPiecesFromContent(text, 'text/plain');
            const transferParams: ITransferParams = {
                transfers: deroChatPieces.map((dcp) => {
                    return {
                        destination,
                        amount: amountPerTransfer,
                        payload_rpc: [
                            { name: CHAT_DATA, datatype: 'S', value: dcp.transfer_data },
                            { name: CHAT_IDENTITY, datatype: 'U', value: dcp.transfer_identity },
                        ],
                    };
                }),
                ringsize,
            };
            return await getDeroInterface().transfer(transferParams);
        }
    } else if (binaryBase64) {
        const deroChatPieces = getDeroChatPiecesFromContent(binaryBase64, binaryMimeType);
        const chunks = chunkArray(deroChatPieces, MAX_TRANSFERS);

        for (let index = 0; index < chunks.length; index++) {
            const chunk = chunks[index];

            console.debug(`Transferring chunk ${index}...`);
            const transferParams: ITransferParams = {
                transfers: chunk.map((dcp) => {
                    return {
                        destination,
                        amount: amountPerTransfer,
                        payload_rpc: [
                            { name: CHAT_DATA, datatype: 'S', value: dcp.transfer_data },
                            { name: CHAT_IDENTITY, datatype: 'U', value: dcp.transfer_identity },
                        ],
                    };
                }),
                ringsize,
            };
            const txid = await getDeroInterface().transfer(transferParams);
            console.debug(`TxID: ${txid}\n\n`);
        }
    }
};

const CHAT_DATA = 'D';
const CHAT_IDENTITY = 'I';

const MAX_PAYLOAD = 144;
const NET_PAYLOAD_SINGLE = MAX_PAYLOAD - 6;
const NET_PAYLOAD_MULTI_START = NET_PAYLOAD_SINGLE - 11;
const NET_PAYLOAD_MULTI_NORMAL = NET_PAYLOAD_SINGLE - 9;

const getDeroChatPiecesFromContent = (content: string, mimeType: string): IDeroChatPiece[] => {
    const pieces = new Array<IDeroChatPiece>();

    const id = Math.floor(Math.random() * 256);

    let start = 0;

    let part = 0;

    const count = Math.ceil((content.length - NET_PAYLOAD_MULTI_START) / NET_PAYLOAD_MULTI_NORMAL) + 1;

    while (start < content.length) {
        const first = part === 0;
        const allowed = first ? NET_PAYLOAD_MULTI_START : NET_PAYLOAD_MULTI_NORMAL;
        const bytesToRead = Math.min(allowed, content.length - start);
        const data = content.substring(start, start + bytesToRead);
        if (first) {
            pieces.push({ id, start: first, part, count, transfer_data: data, transfer_identity: getMessageIdentity(id, part, count, getMimeTypeInt(mimeType)), state: 'PENDING' } as IDeroChatPiece);
        } else {
            pieces.push({ id, start: first, part, count, transfer_data: data, transfer_identity: getMessageIdentity(id, part), state: 'PENDING' } as IDeroChatPiece);
        }
        part++;
        start += bytesToRead;
    }

    return pieces;
};

const getMessageIdentity = (id: number, part: number, count?: number, type?: number) => {
    if (id < 0 || id > 255) throw new Error();
    if (part < 0 || part > 255) throw new Error();

    if (count === undefined && type === undefined) {
        return ((id << 8) | part) >>> 0;
    } else if (count !== undefined && type !== undefined) {
        if (count < 0 || count > 255) throw new Error(`Too many pieces ${count}>256`);
        if (type < 0 || type > 255) throw new Error();

        // const val = (((id << 24) | (part << 16) | (count << 8) | type) >>> 0).toString(2);
        // console.log(id, part, count, type, '====', val);

        return ((id << 24) | (part << 16) | (count << 8) | type) >>> 0;
    }
    throw new Error();
};

const BIT_16 = Math.pow(255, 2);
const BIT_32 = Math.pow(255, 4);

const getDeroChatPiece = (data: string, identity: number) => {
    if (identity < 0 || identity > BIT_32) throw new Error();

    if (identity > BIT_16) {
        // Start header
        let id = (identity >> 24) & 0xff;
        let part = (identity >> 16) & 0xff;
        let count = (identity >> 8) & 0xff;
        let type = identity & 0xff;

        return { start: true, transfer_data: data, transfer_identity: identity, id, part, count, type } as IDeroChatPiece;
    } else {
        // Normal header
        let id = (identity >> 8) & 0xff;
        let part = identity & 0xff;

        return { start: false, transfer_data: data, transfer_identity: identity, id, part } as IDeroChatPiece;
    }
};

export const getEstimatedTransfers = (bytes: number) => {
    if (bytes <= NET_PAYLOAD_SINGLE) return 1;
    return Math.ceil((bytes - NET_PAYLOAD_MULTI_START) / NET_PAYLOAD_MULTI_NORMAL + 1);
};

export const getEstimatedTransferCost = (estimatedTransfers: number) => {
    return estimatedTransfers * 2081;
};

export const getNewChatFor = (value: string | IWalletDirectoryEntry) => {
    let otherParty: IWalletDirectoryEntry;
    if (isWalletDirectoryEntry(value)) {
        otherParty = value;
    } else {
        otherParty = { alias: '', address: value, flags: ['CHAT'] as WalletDirectoryEntryType[], isSaved: false };
    }

    return {
        otherParty,
        startBlock: 0,
        lastBlock: 0,
        receivedMinAmount: 0,
        receivedMaxAmount: 0,
        sentMinAmount: 0,
        sentMaxAmount: 0,
        totalReceived: 0,
        totalSent: 0,
        messages: [],
    };
};

export const addNewTextToChat = (otherParty: string, text: string, totalAmount: number, wasReceived: boolean = false) => {
    const id = Math.floor(Math.random() * 256);
    const tempId = nanoid();

    const chatMessage = { id, otherParty, tempId, amountSent: totalAmount, type: 'text/plain', content: text, wasReceived } as IChatMessage;
    addChatMessage(chatMessage);
};

export const addNewImageToChat = (otherParty: string, base64: string, mimeType: string, totalAmount: number, wasReceived: boolean = false) => {
    const id = Math.floor(Math.random() * 256);
    const tempId = nanoid();

    const chatMessage = { id, otherParty, tempId, amountSent: totalAmount, type: mimeType, content: base64, wasReceived } as IChatMessage;
    addChatMessage(chatMessage);
};

export const scrollToChatBottom = (setCurrent: boolean, addressOrIndex?: string | number, txid?: string) => {
    if (setCurrent) {
        if (typeof addressOrIndex === 'number') {
            setCurrentChat({ index: addressOrIndex });
            addressOrIndex = store.getState().chatState.chats[addressOrIndex].otherParty?.address;
        } else if (typeof addressOrIndex === 'string') {
            setCurrentChat({ address: addressOrIndex });
        }
    }

    const scrollToBottomEvent = new CustomEvent<IEventChatScrollToBottom>(CHAT_SCROLL_TO_BOTTOM, {
        detail: addressOrIndex ? { address: addressOrIndex as string | undefined, txid } : { txid },
    });

    window.dispatchEvent(scrollToBottomEvent);
};

export const sendMessage = async (otherParty: string, content: string, totalAmount: number, type: string = 'text/plain') => {
    const ringsize = 2;

    const id = Math.floor(Math.random() * 256);
    const tempId = nanoid();

    let transactions: IChatTransaction[] = [];

    if (type === 'text/plain' && content.length < NET_PAYLOAD_SINGLE) {
        const chatMessage = { id, otherParty, tempId, amountSent: totalAmount, type, content, wasReceived: false, transactions } as IChatMessage;

        const transactionTempId = nanoid();
        transactions.push({ transactionTempId, state: 'PENDING' });

        addChatMessage(chatMessage);
        scrollToChatBottom(false, otherParty);

        const transferParams: ITransferParams = {
            transfers: [{ destination: otherParty, amount: chatMessage.amountSent, payload_rpc: [{ name: CHAT_DATA, datatype: 'S', value: content }] }],
            ringsize,
        };

        getDeroInterface()
            .transfer(transferParams)
            .then(async (txid) => {
                updateTransferTransaction(otherParty, tempId, transactionTempId, txid, null, 'SUBMITTED');

                try {
                    const tx = await waitForTransaction(txid, true);
                    updateTransferTransaction(otherParty, tempId, transactionTempId, txid, tx.block_height, 'COMPLETED');
                    updateWalletBalance();
                } catch (e) {
                    console.error(e);
                    if (e instanceof Error) {
                        updateTransferTransaction(otherParty, tempId, transactionTempId, null, null, 'FAILED', e.message);
                    } else {
                        updateTransferTransaction(otherParty, tempId, transactionTempId, null, null, 'FAILED');
                    }
                }
            })
            .catch((e) => {
                console.error(e, transferParams);
                addSnackbar({ message: 'Error happened when trying to send the message.', severity: MESSAGE_SEVERITY.ERROR });
                if (e instanceof Error) {
                    updateTransferTransaction(otherParty, tempId, transactionTempId, null, null, 'FAILED', e.message);
                } else {
                    updateTransferTransaction(otherParty, tempId, transactionTempId, null, null, 'FAILED');
                }
            });
    } else {
        const id = Math.floor(Math.random() * 256);
        const deroChatPieces = getDeroChatPiecesFromContent(content, type);
        const chunks = chunkArray(deroChatPieces, MAX_TRANSFERS);

        const chatMessage = { id, otherParty, tempId, amountSent: totalAmount, type, content, wasReceived: false, chatPieces: deroChatPieces, transactions } as IChatMessage;

        let startCount = 0;

        chunks.forEach((chunk) => {
            const transactionTempId = nanoid();

            transactions.push({ transactionTempId, startPart: startCount, endPart: startCount + chunk.length - 1, state: 'PENDING' });
            startCount += chunk.length;
        });

        addChatMessage(chatMessage);
        scrollToChatBottom(false, otherParty);

        const normalAmount = 1;
        const startAmount = totalAmount - (deroChatPieces.length - 1) * normalAmount;

        if (startAmount < 1) throw new Error('Not enough money sent');

        for (let index = 0; index < chunks.length; index++) {
            const chunk = chunks[index];
            const transferParams: ITransferParams = {
                transfers: chunk.map((dcp) => {
                    return {
                        destination: otherParty,
                        amount: dcp.start ? startAmount : normalAmount,
                        payload_rpc: [
                            { name: CHAT_DATA, datatype: 'S', value: dcp.transfer_data },
                            { name: CHAT_IDENTITY, datatype: 'U', value: dcp.transfer_identity },
                        ],
                    };
                }),
                ringsize,
            };

            const transactionTempId = transactions[index].transactionTempId!;

            await getDeroInterface()
                .transfer(transferParams)
                .then(async (txid) => {
                    updateTransferTransaction(otherParty, tempId, transactionTempId, txid, null, 'SUBMITTED');

                    try {
                        const tx = await waitForTransaction(txid, true);
                        updateTransferTransaction(otherParty, tempId, transactionTempId, txid, tx.block_height, 'COMPLETED');
                        updateWalletBalance();
                    } catch (e) {
                        console.error(e);
                        if (e instanceof Error) {
                            updateTransferTransaction(otherParty, tempId, transactionTempId, null, null, 'FAILED', e.message);
                        } else {
                            updateTransferTransaction(otherParty, tempId, transactionTempId, null, null, 'FAILED');
                        }
                    }
                })
                .catch((e) => {
                    console.error(e, transferParams);
                    addSnackbar({ message: 'Error happened when trying to send the message.', severity: MESSAGE_SEVERITY.ERROR });
                    if (e instanceof Error) {
                        updateTransferTransaction(otherParty, tempId, transactionTempId, null, null, 'FAILED', e.message);
                    } else {
                        updateTransferTransaction(otherParty, tempId, transactionTempId, null, null, 'FAILED');
                    }
                });
        }
    }
};

const DELAY_FOR_ENSURING_BLOCK_HAS_ALL_TRANSACTIONS = 1;

export const loadChatMessages = async (lastBlock: number) => {
    lastBlock -= DELAY_FOR_ENSURING_BLOCK_HAS_ALL_TRANSACTIONS;
    const isLoading = getIsLoading();
    let lastCheckedBlock = getLastCheckedBlock();

    if (isLoading) return;
    if (lastCheckedBlock >= lastBlock) return;

    setIsLoading(true);

    const min_height = lastCheckedBlock + 1;

    const transfers = await getDeroInterface().getTransactionList({ min_height, out: true, in: true });

    if (transfers) {
        transfers.forEach((transfer, index) => {
            if (transfer.height > lastCheckedBlock) lastCheckedBlock = transfer.height;
            const chatMessage = getChatMessageFromTransfer(transfer);
            if (chatMessage) {
                addChatMessage(chatMessage);
                scrollToChatBottom(false, chatMessage.otherParty);
            }
        });
    }

    if (lastBlock > lastCheckedBlock) lastCheckedBlock = lastBlock;

    setLastCheckedBlock(lastCheckedBlock);
    setIsLoading(false);
};

const getChatMessageFromTransfer = (transfer: ITransferEntry) => {
    if (!transfer.payload_rpc) return;
    const D = transfer.payload_rpc.find((p) => p.datatype === 'S' && p.name === 'D')?.value as string;
    const I = transfer.payload_rpc.find((p) => p.datatype === 'U' && p.name === 'I')?.value as Uint64;

    const COUNT = transfer.payload_rpc.length;

    let type = null;

    if (D && COUNT == 1) {
        // Single text message
        const id = -1;
        const blockheight = transfer.height;
        const newChatMessage = {
            tempId: nanoid(),
            blockheight_id: `${blockheight}_${id}`,
            id,
            startTxid: transfer.txid,
            blockheight,
            time: transfer.time,
            otherParty: transfer.incoming ? transfer.sender : transfer.destination,
            amountSent: transfer.amount,
            type: 'text/plain',
            content: D,
            wasReceived: transfer.incoming,
            transactions: [],
            chatPieces: [],
        } as IChatMessage;

        return newChatMessage;
    } else if (D && I && COUNT == 2) {
        // Multi message
        const chatPiece = getDeroChatPiece(D, I);
        const id = chatPiece.id;
        const blockheight = transfer.height;

        if (chatPiece.start) {
            tempMultiStartTransfer.set(id, transfer);
        } else {
            let transfers: ITransferEntry[];
            if (!tempMultiOtherTransfers.has(id)) {
                transfers = [];
                tempMultiOtherTransfers.set(id, transfers);
            } else {
                transfers = tempMultiOtherTransfers.get(id)!;
            }
            transfers.push(transfer);
        }

        addPiece(chatPiece);

        const newChatMessage = getMultiMessageFromStorage(id);

        return newChatMessage;
    }
    return null;
};

const tempMultiStorage = new Map<number, IDeroChatPiece[]>();
const tempMultiStartTransfer = new Map<number, ITransferEntry>();
const tempMultiOtherTransfers = new Map<number, ITransferEntry[]>();

const addPiece = (piece: IDeroChatPiece) => {
    if (tempMultiStorage.has(piece.id)) {
        const chatPieces = tempMultiStorage.get(piece.id);
        chatPieces!.push(piece);
    } else {
        tempMultiStorage.set(piece.id, [piece]);
    }
};

const getMultiMessageFromStorage = (id: number) => {
    const chatPieces = tempMultiStorage.get(id);

    if (chatPieces) {
        const startPiece = chatPieces.find((piece) => piece.start);
        if (!startPiece) return null;
        const startTransfer = tempMultiStartTransfer.get(id);
        if (!startTransfer) return null;
        const count = startPiece.count;
        const type = getMimeTypeString(startPiece.type!);
        chatPieces.sort((a, b) => a.part - b.part);

        if (chatPieces.length != count || !chatPieces.every((piece, index) => piece.part === index)) return null;

        const content = chatPieces.map((piece) => piece.transfer_data).join('');

        const amountSent = tempMultiOtherTransfers.get(id)!.reduce((acc, transfer) => {
            return acc + transfer.amount;
        }, startTransfer.amount);

        const blockheight = startTransfer.height;

        const newChatMessage = {
            tempId: nanoid(),
            blockheight_id: `${blockheight}_${id}`,
            startTxid: startTransfer.txid,
            id,
            blockheight,
            time: startTransfer.time,
            otherParty: startTransfer.incoming ? startTransfer.sender : startTransfer.destination,
            amountSent,
            type,
            content,
            wasReceived: startTransfer.incoming,
            transactions: [],
            chatPieces: [],
        } as IChatMessage;

        tempMultiStorage.delete(id);
        tempMultiStartTransfer.delete(id);
        tempMultiOtherTransfers.delete(id);

        return newChatMessage;
    }
};

const getMimeTypeString = (type: number) => {
    switch (type) {
        case 0:
            return 'text/plain';
        case 1:
            return 'image/jpeg';
        case 2:
            return 'image/png';
        case 3:
            return 'image/webp';
        case 4:
            return 'audio/webm';
    }
    return 'text/plain';
};

const getMimeTypeInt = (type: string) => {
    switch (type) {
        case 'text/plain':
            return 0;
        case 'image/jpeg':
            return 1;
        case 'image/png':
            return 2;
        case 'image/webp':
            return 3;
        case 'audio/webm':
            return 4;
    }
    return 0;
};

export const goToChat = (otherParty: string | IWalletDirectoryEntry, openInNewWindow: boolean = false) => {
    if (openInNewWindow) {
        const action = 'OPEN_CHAT';
        let data: IHaloButtonChatActionParameters;
        if (isWalletDirectoryEntry(otherParty)) {
            data = { alias: otherParty.alias ?? 'Unknown', address: otherParty.address };
        } else {
            data = { alias: '', address: otherParty };
        }
        const urlSearchParams = `action=${encodeURIComponent(action)}&data=${encodeURIComponent(JSON.stringify(data))}`;

        const xswdport = getXswdPort();
        const xswdParam = xswdport === XSWD_DEFAULTPORT ? '' : `xswdport=${xswdport}&`;

        goToLink(`/?${xswdParam}url=${encodeURIComponent(urlSearchParams)}`, true);
        return;
    }

    const address = isWalletDirectoryEntry(otherParty) ? otherParty.address : otherParty;
    const existingChat = store.getState().chatState.chats.find((chat) => chat.otherParty?.address === address);

    if (!existingChat) {
        addChat(getNewChatFor(otherParty), true);
    }
    setCurrentTab('Chat');
};
