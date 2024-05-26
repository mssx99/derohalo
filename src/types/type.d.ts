type SmartContractType = 'MULTISIGNATURE' | 'GUARANTEE' | 'WEB';

interface IContract {
    contractType: SmartContractType;
    scid?: string;
    description?: string;
    code?: string;
    compareCode?: string;
    ownerAddress?: string;
}

interface IWebContract extends IContract {
    name: string;
    description: string;
    chatPublishFee: Uint64;
    chatPublishFeeMinimum: Uint64;
    guaranteePublishFee: Uint64;
    guaranteePublishFeeMinimum: Uint64;
    guaranteeApprovalRequiredBeforePublishing: boolean;
    guaranteeBlockPackageSize: Uint64;
    guaranteeBlockPackagePrice: Uint64;
    listings: { [key: string]: IListing };
    directoryEntries: { [key: string]: IChatDirectoryEntry[] };
}

interface IChatDirectoryEntry {
    otherParty: string | null;
    alias: string;
    description: string;
    minimum: Uint64;
}

type ListingStateType = 'NOT_LOADED' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'CLOSED';
type ListingLoadingStateType = 'PENDING' | 'LOADING' | 'LOADED' | 'ERROR';

interface IListing {
    listingKey: string;
    scid: string;
    market: string;
    partyA?: string;
    partyA_requiredGuaranteeTotal?: Uint64;
    partyA_requiredPaymentsTotal?: Uint64;
    partyB_requiredGuaranteeTotal?: Uint64;
    partyB_requiredPaymentsTotal?: Uint64;
    paid: Uint64;
    paidUntilBlock: Uint64;
    state: ListingStateType;
    loadingState: ListingLoadingStateType;
    contract?: IGuaranteeContract;
    verified: boolean;
}

interface IGuaranteeContract extends IContract {
    firstPartyWallet: IWallet | null;
    firstPartyAmountFunded: boolean;

    secondPartyWallet: IWallet | null;
    secondPartyAmountFunded: boolean;

    state: 'NEW' | 'PENDING_DEPOSITS' | 'STARTED' | 'ENDED';
    stages: IStage[];
    images: { [key: string]: IGuaranteeImage };
}

interface IGuaranteeImage {
    id: string;
    thumb: string;
    fullImage: string;
    description: string;
}

interface IStage {
    id: Uint64;
    description: string | null;
    blocks: Uint64;
    offsetTo?: Uint64;
    a_Transfer: number;
    a_Guarantee: number;
    b_Transfer: number;
    b_Guarantee: number;
    a_Approved: boolean;
    b_Approved: boolean;
    renderId?: string;
    color?: string;
    loadedMaxBlockheight?: Uint64;
    loadedFinishedBlockheight?: Uint64;
}

interface IGuaranteeStats {
    [key: string]: Uint64 | undefined;
    calculatedAtBlockheight: Uint64;
    a_RequiredDeposit: Uint64;
    a_TotalGuarantee: Uint64;
    a_TotalTransfer: Uint64;
    a_TotalLoss: Uint64;
    a_TotalPendingGuarantee: Uint64;
    a_TotalPendingTransfer: Uint64;
    b_RequiredDeposit: Uint64;
    b_TotalGuarantee: Uint64;
    b_TotalTransfer: Uint64;
    b_TotalLoss: Uint64;
    b_TotalPendingGuarantee: Uint64;
    b_TotalPendingTransfer: Uint64;
}

interface IMultiSigContract extends IContract {
    creator: string;
    involvedParties: IWallet[];
    authorizationGroups: IAuthorizationGroup[];
    proposedTransactions: IAtomicTransaction[];
    maxTransactionsInAtomic: Uint64;
    variables?: { [key: string]: string | number };
}

interface IAuthorizationGroup extends ICondition {
    id: string;
    description: string;
    requiredApprovers?: number;
    maximumWithdrawal?: Uint64;
    withdrawalStartIn?: Uint64;
    withdrawalBlockheight?: Uint64;
    approvers: IApprover[];
    furtherDelay?: IWallet[];
}

interface IApprover {
    id: string;
    wallet: IWallet;
}

interface IWallet {
    id: string;
    address: string | null;
    alias: string;
    color: string | null;
    isHovered: boolean;
}

type ApprovalType = 'APPROVED' | 'REJECTED' | '';
type TransactionStateType = 'NEW' | 'PENDING' | 'DONE' | 'CANCELLED';

interface IAtomicTransaction {
    txid?: string;
    atomicId?: Uint64;
    transactions: ITransaction[];
    approvalStatus: IApprovalStatus;
    createdBy: string | null;
    state: TransactionStateType;
}

interface IApprovalStatus {
    [signer: string]: ApprovalType;
}

interface ITransaction {
    address: string;
    amount: Uint64;
}

interface IDepositTransaction {
    address: string;
    amount: Uint64;
}
