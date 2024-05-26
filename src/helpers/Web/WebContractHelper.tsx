import { addSnackbar } from 'components/screen/Snackbars';
import { convertToFormatIndependentDeroAddress, installSmartContract, scInvoke, waitForTransaction } from 'helpers/DeroHelper';
import WebContract from './WebContract';
import { isShowContractVerificationAlways, setBusyBackdrop } from 'hooks/mainHooks';
import { MAX_CHAT_PERCENTAGE, MESSAGE_SEVERITY, SHOW_COMPARISON_ALWAYS } from 'Constants';
import { ContractLoadError, WebContractLoadError } from 'customErrors';
import { setContract, setWebSmartContractBalances } from 'hooks/webHooks';
import { getSmartContractCode } from 'helpers/ContractHelper';
import { getDeroInterface, getWalletAddress, updateWalletBalance } from 'hooks/deroHooks';
import WEB_CONTRACT_CODE from './WebContract';
import { setCompareLoadContractResult } from 'components/common/dialogs/CompareSmartContractDialog';
import { updateSmartContracts } from 'helpers/DirectoryHelper';
import LocalStorage from 'browserStorage/localStorage';
import { CachedLoader } from 'components/Listings/CachedLoader';

export const initWebContract = async () => {
    const lastOpenedWebContract = LocalStorage.getLastOpenedWebContract();
    await loadContractAndSet(lastOpenedWebContract ?? process.env.REACT_APP_WEB_SC!, false);
};

export const installWebContract = async () => {
    setBusyBackdrop(true, 'Installing SmartContract...');
    try {
        const txid = await installSmartContract(WebContract);
        addSnackbar({ message: `Contract submitted. Txid: ${txid}`, severity: MESSAGE_SEVERITY.INFO });
        await waitForTransaction(txid, true);
        addSnackbar({ message: `Contract installed successfully. Scid: ${txid}`, severity: MESSAGE_SEVERITY.SUCCESS });
        try {
            await loadContractAndSet(txid, false);
            updateSmartContracts();
        } catch (e) {
            if (e instanceof WebContractLoadError) {
                addSnackbar({ message: `This seems not to be a valid WebContract.`, severity: MESSAGE_SEVERITY.ERROR });
            }
        }
    } catch (e) {
        addSnackbar({ message: `An error occurred installing the SmartContract.`, severity: MESSAGE_SEVERITY.ERROR });
    } finally {
        setBusyBackdrop(false);
        updateWalletBalance();
    }
};

export const loadContract = async (scid: string): Promise<ILoadContractResult> => {
    try {
        console.log('Trying to load', scid);
        const result = await getDeroInterface().getSmartContract({ scid, code: true, variables: true });

        if (!result.stringkeys) {
            throw Error('No variables.');
        }

        const listings = parseListings(result.stringkeys!);

        const directoryEntries = parseDirectoryEntries(result.stringkeys!);

        const contract = {
            scid,
            name: result.stringkeys['Name'] as string,
            description: result.stringkeys['Description'] as string,
            contractType: 'WEB',
            ownerAddress: result.stringkeys['OwnerAddress'] as string,
            chatPublishFee: result.stringkeys['ChatPublishFee'] as Uint64,
            chatPublishFeeMinimum: result.stringkeys['ChatPublishFeeMinimum'] as Uint64,
            guaranteePublishFee: result.stringkeys['GuaranteePublishFee'] as Uint64,
            guaranteePublishFeeMinimum: result.stringkeys['GuaranteePublishFeeMinimum'] as Uint64,
            guaranteeApprovalRequiredBeforePublishing: (result.stringkeys['GuaranteeApprovalRequiredBeforePublishing'] as number) === 1,
            guaranteeBlockPackageSize: result.stringkeys['GuaranteeBlockPackageSize'] as Uint64,
            guaranteeBlockPackagePrice: result.stringkeys['GuaranteeBlockPackagePrice'] as Uint64,
            listings,
            code: getSmartContractCode(result),
            compareCode: WEB_CONTRACT_CODE,
            directoryEntries,
        } as IWebContract;

        return { contract, balances: result.balances! };
    } catch (e) {
        console.error(e);
        throw new ContractLoadError();
    }
};

export const loadContractAndSet = async (scid: string, validation: boolean = true) => {
    try {
        const { contract, balances } = await loadContract(scid);

        if (validation && (contract.code !== contract.compareCode || SHOW_COMPARISON_ALWAYS || isShowContractVerificationAlways())) {
            setCompareLoadContractResult({ contract, balances });
        } else {
            setVerifiedWebContractAndBalances({ contract, balances });
            LocalStorage.setLastOpenedWebContract(contract.scid!);
            if (validation) {
                addSnackbar({ message: `The contract was loaded successfully.`, severity: MESSAGE_SEVERITY.SUCCESS });
            }
        }
    } catch (e) {
        addSnackbar({ message: `Error loading the contract.`, severity: MESSAGE_SEVERITY.ERROR });
    }
};

export const setVerifiedWebContractAndBalances = ({ contract, balances }: ILoadContractResult) => {
    setContract(contract as IWebContract);
    setWebSmartContractBalances(balances);
    updateSmartContracts();
};

export const parseListings = (stringkeys: { [key: string]: string | number }): { [key: string]: IListing } => {
    const walletAddress = getWalletAddress();
    const coreAddress = convertToFormatIndependentDeroAddress(walletAddress);

    const listingEntries: { [key: string]: IListing } = {};

    for (const key in stringkeys) {
        const keyParts = key.split('_');
        if (keyParts[0] == 'ListingOwner') {
            const listingKey = keyParts[1];

            const scid = stringkeys[`ListingScid_${listingKey}`] as string;
            const market = stringkeys[`ListingMarket_${listingKey}`] as string;
            const paidUntilBlock = stringkeys[`ListingBlockheight_${listingKey}`] as Uint64;
            const paid = stringkeys[`ListingPaid_${listingKey}`] as Uint64;
            const state: ListingStateType = stringkeys[`ListingStatus_${listingKey}`] as ListingStateType;
            const loadingState: ListingLoadingStateType = 'PENDING';

            listingEntries[listingKey] = { listingKey, scid, market, paid, paidUntilBlock, state, loadingState, verified: false };
        }
    }

    return CachedLoader.applyCache(listingEntries);
};

export const parseDirectoryEntries = (stringkeys: { [key: string]: string | number }): { [key: string]: IChatDirectoryEntry[] } => {
    const walletAddress = getWalletAddress();
    const coreAddress = convertToFormatIndependentDeroAddress(walletAddress);

    const directoryEntries: { [key: string]: IChatDirectoryEntry[] } = {};

    for (const key in stringkeys) {
        const keyParts = key.split('_');
        if (keyParts[0] == 'ChatMinimum') {
            const isSpecific = keyParts.length == 3;
            const address = keyParts[1];
            const otherParty = isSpecific ? keyParts[2] : null;

            const alias = stringkeys[isSpecific ? `ChatAlias_${keyParts[1]}_${keyParts[2]}` : `ChatAlias_${keyParts[1]}`] as string;
            const description = stringkeys[isSpecific ? `ChatDescription_${keyParts[1]}_${keyParts[2]}` : `ChatDescription_${keyParts[1]}`] as string;
            const minimum = stringkeys[key] as number;

            if (address === coreAddress || otherParty == null || otherParty === coreAddress) {
                if (!directoryEntries[address]) {
                    directoryEntries[address] = [];
                }
                directoryEntries[address].push({ otherParty, alias, description, minimum });
            }
        }
    }

    return directoryEntries;
};

export const saveConfiguration = async ({
    scid,
    name,
    description,
    chatPublishFee,
    chatPublishFeeMinimum,
    guaranteePublishFee,
    guaranteePublishFeeMinimum,
    guaranteeApprovalRequiredBeforePublishing,
    guaranteeBlockPackageSize,
    guaranteeBlockPackagePrice,
}: {
    scid: Hash;
    name: string;
    description: string;
    chatPublishFee: Uint64;
    chatPublishFeeMinimum: Uint64;
    guaranteePublishFee: Uint64;
    guaranteePublishFeeMinimum: Uint64;
    guaranteeApprovalRequiredBeforePublishing: boolean;
    guaranteeBlockPackageSize: Uint64;
    guaranteeBlockPackagePrice: Uint64;
}) => {
    const txid = await scInvoke({
        scid,
        entrypoint: 'Configure',
        sc_rpc: [
            { name: 'name', datatype: 'S', value: name },
            { name: 'description', datatype: 'S', value: description },
            { name: 'chatPublishFee', datatype: 'U', value: chatPublishFee },
            { name: 'chatPublishFeeMinimum', datatype: 'U', value: chatPublishFeeMinimum },
            { name: 'guaranteePublishFee', datatype: 'U', value: guaranteePublishFee },
            { name: 'guaranteePublishFeeMinimum', datatype: 'U', value: guaranteePublishFeeMinimum },
            { name: 'guaranteeApprovalRequiredBeforePublishing', datatype: 'U', value: guaranteeApprovalRequiredBeforePublishing ? 1 : 0 },
            { name: 'guaranteeBlockPackageSize', datatype: 'U', value: guaranteeBlockPackageSize },
            { name: 'guaranteeBlockPackagePrice', datatype: 'U', value: guaranteeBlockPackagePrice },
        ],
        waitFor: true,
    });
    console.log('configure txid', txid);
    loadContractAndSet(scid, false);
};

export const calculateChatMinimumFees = (contract: IWebContract, chatMinimum: number) => {
    const { chatPublishFee } = contract;

    if (chatPublishFee > MAX_CHAT_PERCENTAGE) {
        // Absolute
        return chatPublishFee - MAX_CHAT_PERCENTAGE - 1;
    } else {
        // Percentage
        return (chatPublishFee / 1000) * chatMinimum;
    }
};

export const approveListing = async (scid: string, listingKey: string) => {
    let sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'listingKey', datatype: 'S', value: listingKey });

    const txid = await scInvoke({ scid, entrypoint: 'ApproveListing', sc_rpc, waitFor: true });

    return txid;
};

export const returnMoneyAndRemove = async (scid: string, listingKey: string) => {
    let sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'listingKey', datatype: 'S', value: listingKey });

    const txid = await scInvoke({ scid, entrypoint: 'ReturnMoneyAndRemove', sc_rpc, waitFor: true });

    return txid;
};
