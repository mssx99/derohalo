import { useSelector } from 'react-redux';
import store, { RootState } from 'store';
import { webStateActions } from 'store/reducers/webStateReducer';
import { getWalletAddress, useCurrentBlockheight, useCurrentBlockheightOrEstimate, useIsWalletAddress, useWalletAddress } from './deroHooks';
import { convertToFormatIndependentDeroAddress, scInvoke } from 'helpers/DeroHelper';
import { createSelector } from 'reselect';
import { useContract as useGuaranteeContract } from './guaranteeHooks';
import { sha3_256 } from 'js-sha3';
import { MAX_GUARANTEE_PERCENTAGE } from 'Constants';
import { loadContractAndSet } from 'helpers/Web/WebContractHelper';

export const setContract: (contract: IWebContract) => void = (contract) => {
    store.dispatch(webStateActions.setContract(contract));
};

export const useContract = () => {
    const contract = useSelector((state: RootState) => state.webState.contract);
    return contract;
};

const DEFAULT_PUBLIC_CHAT_MINIMUM = 1;
const DEFAULT_CHAT_DIRECTORY_ENTRY = { otherParty: null, alias: 'N/A', description: 'N/A', minimum: DEFAULT_PUBLIC_CHAT_MINIMUM } as IChatDirectoryEntry;

const selectHereThereChatMinimums = createSelector(
    [(state: RootState) => state.webState.contract?.directoryEntries, (_, walletAddress) => walletAddress, (_, __, otherPartyAddress) => otherPartyAddress, (_, __, ___, chat) => chat],
    (directoryEntries, walletAddress, otherPartyAddress, chat) => {
        let here = DEFAULT_CHAT_DIRECTORY_ENTRY;
        let there = DEFAULT_CHAT_DIRECTORY_ENTRY;
        if (walletAddress && chat) {
            if (directoryEntries) {
                const myDirectoryEntries = directoryEntries[walletAddress];

                if (myDirectoryEntries && myDirectoryEntries.length > 0) {
                    const de = myDirectoryEntries.find((de) => de.otherParty === otherPartyAddress);
                    if (de) {
                        here = de;
                    } else {
                        here = myDirectoryEntries[0];
                    }
                }

                const thereDirectoryEntries = directoryEntries[otherPartyAddress];

                if (thereDirectoryEntries && thereDirectoryEntries.length > 0) {
                    const de = thereDirectoryEntries.find((de) => de.otherParty === walletAddress);
                    if (de) {
                        there = de;
                    } else {
                        there = thereDirectoryEntries[0];
                    }
                }
            }
        }
        return { here, there };
    }
);

export const usePublicDirectoryEntryForChat = (chat: IChat | null) => {
    const walletAddress = convertToFormatIndependentDeroAddress(useWalletAddress());
    const otherPartyAddress = convertToFormatIndependentDeroAddress(chat?.otherParty?.address ?? null);

    const hereThere = useSelector((state: RootState) => selectHereThereChatMinimums(state, walletAddress, otherPartyAddress, chat));

    return hereThere;
};

export const useIsWebOwner = () => {
    const contract = useContract();
    const isOwner = useIsWalletAddress(contract?.ownerAddress ?? '');

    return isOwner;
};

const selectCurrentListing = createSelector([(state: RootState) => state.webState.contract?.listings, (_, listingKey) => listingKey], (listings, listingKey) => {
    let listing: IListing | null = null;
    if (listings && listingKey) {
        if (listings.hasOwnProperty(listingKey)) {
            listing = listings[listingKey];
        }
    }

    return listing;
});

export const useCurrentGuaranteeContractListing = () => {
    const { contract } = useGuaranteeContract();
    const walletAddress = useWalletAddress();
    const shortAddress = convertToFormatIndependentDeroAddress(walletAddress);

    const listingKey = contract?.scid != null && shortAddress != null ? sha3_256(`${contract.scid}_${shortAddress}`) : null;

    const listing = useSelector((state: RootState) => selectCurrentListing(state, listingKey));
    return listing;
};

const selectListings = createSelector([(state: RootState) => state.webState.contract?.listings, (_, listingState) => listingState], (listings, listingState) => {
    const pendingListings: IListing[] = [];
    if (listings) {
        for (let key in listings) {
            const listing = listings[key];
            if (listing.state === listingState) {
                pendingListings.push(listing);
            }
        }
    }

    return pendingListings;
});

export const usePendingListings = () => {
    const pendingListings = useSelector((state: RootState) => selectListings(state, 'PENDING_APPROVAL')) as IListing[];
    return pendingListings;
};

const selectPaidListings = createSelector(
    [(state: RootState) => state.webState.contract?.listings, (_, listingState) => listingState, (_, __, currentBlockheight) => currentBlockheight],
    (listings, listingState, currentBlockheight) => {
        const paidListings: IListing[] = [];
        if (listings) {
            for (let key in listings) {
                const listing = listings[key];
                if (listing.state === listingState && listing.paidUntilBlock >= currentBlockheight) {
                    paidListings.push(listing);
                }
            }
        }

        return paidListings;
    }
);

export const usePaidListings = () => {
    const currentBlockheight = useCurrentBlockheight();
    const pendingListings = useSelector((state: RootState) => selectPaidListings(state, 'ACTIVE', currentBlockheight)) as IListing[];
    return pendingListings;
};

export const setWebSmartContractBalances = (balances: { [scid: Hash]: Uint64 }) => {
    store.dispatch(webStateActions.setSmartContractBalances(balances));
};

export const registerChatMinimum = async (scid: string, fees: Uint64, otherPartyAddress: string | null, alias: string | null, description: string | null, chatMinimum: number) => {
    const sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'chatMinimum', datatype: 'U', value: chatMinimum });
    sc_rpc.push({ name: 'alias', datatype: 'S', value: alias ?? '' });
    sc_rpc.push({ name: 'description', datatype: 'S', value: description ?? '' });
    sc_rpc.push({ name: 'destAccount', datatype: 'S', value: otherPartyAddress ?? '' });

    const txid = await scInvoke({ scid, entrypoint: 'PublishChatMinimum', sc_dero_deposit: fees, sc_rpc, waitFor: true });
};

export const calculateTotalGuaranteeFee = (webContract: IWebContract, guaranteeContract: IGuaranteeContract, stats: IGuaranteeStats, purchasedPackages?: number) => {
    const isPercentage = webContract.guaranteePublishFee <= MAX_GUARANTEE_PERCENTAGE;

    const packagePurchase = purchasedPackages ? purchasedPackages * webContract.guaranteeBlockPackagePrice : 0;

    if (isPercentage) {
        const c = Math.floor(((stats.a_RequiredDeposit + stats.b_RequiredDeposit) * webContract.guaranteePublishFee) / 100000);

        return (c < webContract.guaranteePublishFeeMinimum ? webContract.guaranteePublishFeeMinimum : c) + packagePurchase;
    } else {
        return webContract.guaranteePublishFee - MAX_GUARANTEE_PERCENTAGE - 1 + packagePurchase;
    }
};

export const registerGuarantee = async (webScid: string, fees: Uint64, guaranteeScid: string, market: string, packages: number, guaranteeAmount: Uint64) => {
    const sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'scid', datatype: 'S', value: guaranteeScid });
    sc_rpc.push({ name: 'market', datatype: 'S', value: market });
    sc_rpc.push({ name: 'packages', datatype: 'U', value: packages });
    sc_rpc.push({ name: 'guaranteeAmount', datatype: 'U', value: guaranteeAmount });

    const txid = await scInvoke({ scid: webScid, entrypoint: 'PublishToMarket', sc_dero_deposit: fees, sc_rpc, waitFor: true });
};

export const removeListing = async (webScid: string, guaranteeScid: string) => {
    const sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'scid', datatype: 'S', value: guaranteeScid });

    const txid = await scInvoke({ scid: webScid, entrypoint: 'RemoveListing', sc_rpc, waitFor: true });
};

export const updateListing = (listing: IListing) => {
    store.dispatch(webStateActions.updateListing(listing));
};

export const updateWebContract = () => {
    const scid = store.getState().webState.contract?.scid;

    if (scid) {
        loadContractAndSet(scid, false);
    }
};
