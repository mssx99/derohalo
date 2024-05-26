import { nanoid } from 'nanoid';
import { IS_DEBUG } from 'Constants';
import { setContract as setMultiSigContract } from 'hooks/multiSigHooks';
import { setContract as setGuaranteeContract } from 'hooks/guaranteeHooks';
import { getInvolvedParties, loadContractAndSet as loadContractAndSetMultiSig } from './MultiSig/MultiSigSmartContractHelper';
import { loadContractAndSet as loadContractAndSetGuarantee, reassignColors } from './Guarantee/GuaranteeSmartContractHelper';
import LocalStorage from 'browserStorage/localStorage';

export const CONTRACT_TYPES = {
    MultiSig: 'MULTISIGNATURE',
    Guarantee: 'GUARANTEE',
} as const;

export type CONTRACT_TYPE_KEYS = (typeof CONTRACT_TYPES)[keyof typeof CONTRACT_TYPES];

export const setDefaultContracts = () => {
    const lastMultiSigContract = LocalStorage.getLastOpenedMultiSigContract();
    if (!lastMultiSigContract) {
        const multiSigContract = createNewMultiSigContract();
        setMultiSigContract(multiSigContract);
    }
    const lastGuaranteeContract = LocalStorage.getLastOpenedGuaranteeContract();
    if (!lastGuaranteeContract) {
        const guaranteeContract = createNewGuaranteeContract();
        setGuaranteeContract(guaranteeContract);
    }
};

export const loadLastOpenedContractsOnConnect = () => {
    const lastMultiSigContract = LocalStorage.getLastOpenedMultiSigContract();
    if (lastMultiSigContract) {
        loadContractAndSetMultiSig(lastMultiSigContract, false);
    }
    const lastGuaranteeContract = LocalStorage.getLastOpenedGuaranteeContract();
    if (lastGuaranteeContract) {
        loadContractAndSetGuarantee(lastGuaranteeContract, false);
    }
};

export const createWallet = (alias: string, address?: string | null): IWallet => {
    return {
        id: nanoid(),
        address: address ? address : null,
        alias,
        color: null,
        isHovered: false,
    } as IWallet;
};

export const createApprover = (wallet: IWallet): IApprover => {
    return {
        id: nanoid(),
        wallet,
    } as IApprover;
};

export const createAuthorizationGroup = ({
    approvers,
    maximumWithdrawal,
    requiredApprovers,
}: {
    approvers?: IApprover[] | IApprover | null;
    maximumWithdrawal?: Uint64;
    requiredApprovers?: Uint64;
}): IAuthorizationGroup => {
    return {
        id: nanoid(),
        approvers: Array.isArray(approvers) ? (approvers as IApprover[]) : ((approvers ? [approvers] : []) as IApprover[]),
        maximumWithdrawal,
        requiredApprovers,
    } as IAuthorizationGroup;
};

export const createNewMultiSigContract = (): IMultiSigContract => {
    let contract: IMultiSigContract;

    if (IS_DEBUG || true) {
        const wallet1: IWallet = createWallet('Caroline', process.env.REACT_APP_ADDRESS_CAROLINE);
        const approver1: IApprover = createApprover(wallet1);

        const wallet2: IWallet = createWallet('Child1', process.env.REACT_APP_ADDRESS_CHILD1);
        const approver2: IApprover = createApprover(wallet2);

        const wallet3: IWallet = createWallet('Child2', process.env.REACT_APP_ADDRESS_CHILD2);
        const approver3: IApprover = createApprover(wallet3);

        const wallet4: IWallet = createWallet('Johnny', process.env.REACT_APP_ADDRESS_JOHNNY);
        const approver4: IApprover = createApprover(wallet4);

        const authorizationGroup1: IAuthorizationGroup = createAuthorizationGroup({ approvers: approver4 });

        const authorizationGroup2: IAuthorizationGroup = createAuthorizationGroup({ approvers: [approver1, approver2, approver3], requiredApprovers: 2, maximumWithdrawal: 200000 });

        contract = {
            contractType: CONTRACT_TYPES.MultiSig,
            creator: 'me',
            involvedParties: [wallet4],
            authorizationGroups: [authorizationGroup1, authorizationGroup2],
            proposedTransactions: [],
            maxTransactionsInAtomic: 5,
        };

        contract.involvedParties = getInvolvedParties(contract);
    } else {
        contract = {
            contractType: CONTRACT_TYPES.MultiSig,
            creator: 'me',
            involvedParties: [],
            authorizationGroups: [],
            proposedTransactions: [],
            maxTransactionsInAtomic: 5,
        };

        contract.involvedParties = getInvolvedParties(contract);
    }

    return contract;
};

export const createNewGuaranteeContract: () => IGuaranteeContract = () => {
    const wallet1: IWallet = createWallet('Caroline', process.env.REACT_APP_ADDRESS_CAROLINE);

    const wallet2: IWallet = createWallet('Child1', process.env.REACT_APP_ADDRESS_CHILD1);

    // const contract: IGuaranteeContract = {
    //     contractType: CONTRACT_TYPES.Guarantee,
    //     firstPartyWallet: wallet1,
    //     firstPartyAmountFunded: false,

    //     secondPartyWallet: wallet2,
    //     secondPartyAmountFunded: false,

    //     state: 'NEW',
    //     stages: [
    //         createGuaranteeStage({ id: 1, blocks: 1500 * 5, offsetTo: -1, a_Transfer: 400000, a_Guarantee: 10000000, b_Transfer: 0, b_Guarantee: 30000000, description: 'Sending first guitar.' }),
    //         createGuaranteeStage({ id: 2, blocks: 1500 * 10, offsetTo: 1, a_Transfer: 0, a_Guarantee: 10000000, b_Transfer: 0, b_Guarantee: 30000000, description: 'Sending 5 guitars more.' }),
    //         createGuaranteeStage({ id: 3, blocks: 1500 * 5, offsetTo: 2, a_Transfer: 0, a_Guarantee: 10000000, b_Transfer: 0, b_Guarantee: 30000000 }),
    //         createGuaranteeStage({ id: 4, blocks: 1500 * 5, offsetTo: 3, a_Transfer: 400000, a_Guarantee: 10000000, b_Transfer: 0, b_Guarantee: 30000000 }),
    //         createGuaranteeStage({ id: 5, blocks: 1500 * 8, offsetTo: 2, a_Transfer: 0, a_Guarantee: 10000000, b_Transfer: 0, b_Guarantee: 30000000 }),
    //         createGuaranteeStage({ id: 6, blocks: 1500 * 8, offsetTo: -2, a_Transfer: 0, a_Guarantee: 10000000, b_Transfer: 0, b_Guarantee: 30000000 }),
    //         createGuaranteeStage({ id: 7, blocks: 5000000, a_Transfer: 0, a_Guarantee: 10000000, b_Transfer: 0, b_Guarantee: 30000000 }),
    //     ],
    // };

    const contract: IGuaranteeContract = {
        contractType: CONTRACT_TYPES.Guarantee,
        firstPartyWallet: wallet1,
        firstPartyAmountFunded: false,

        secondPartyWallet: wallet2,
        secondPartyAmountFunded: false,

        state: 'NEW',
        stages: [
            createGuaranteeStage({ id: 1, blocks: 1500 * 5, offsetTo: -1, a_Transfer: 400, a_Guarantee: 10000, b_Transfer: 0, b_Guarantee: 30000, description: 'Sending first guitar.' }),
            createGuaranteeStage({ id: 2, blocks: 1500 * 10, offsetTo: 1, a_Transfer: 0, a_Guarantee: 10000, b_Transfer: 0, b_Guarantee: 30000, description: 'Sending 5 guitars more.' }),
            createGuaranteeStage({ id: 3, blocks: 1500 * 5, offsetTo: 2, a_Transfer: 0, a_Guarantee: 10000, b_Transfer: 0, b_Guarantee: 30000 }),
            createGuaranteeStage({ id: 4, blocks: 1500 * 5, offsetTo: 3, a_Transfer: 400, a_Guarantee: 10000, b_Transfer: 0, b_Guarantee: 30000 }),
            createGuaranteeStage({ id: 5, blocks: 1500 * 8, offsetTo: 2, a_Transfer: 0, a_Guarantee: 10000, b_Transfer: 0, b_Guarantee: 30000 }),
            createGuaranteeStage({ id: 6, blocks: 1500 * 8, offsetTo: -2, a_Transfer: 0, a_Guarantee: 10000, b_Transfer: 0, b_Guarantee: 30000 }),
            createGuaranteeStage({ id: 7, blocks: 200000, a_Transfer: 0, a_Guarantee: 10000, b_Transfer: 0, b_Guarantee: 30000 }),
        ],
        images: {},
    };

    reassignColors(contract);

    return contract;
};

export const createGuaranteeStage = ({
    id = 0,
    description = null,
    blocks = 0,
    offsetTo,
    a_Transfer = 0,
    a_Guarantee = 0,
    b_Transfer = 0,
    b_Guarantee = 0,
    a_Approved = false,
    b_Approved = false,
}: {
    id?: Uint64;
    description?: string | null;
    blocks?: Uint64;
    offsetTo?: Uint64;
    a_Transfer?: Uint64;
    a_Guarantee?: Uint64;
    b_Transfer?: Uint64;
    b_Guarantee?: Uint64;
    a_Approved?: boolean;
    b_Approved?: boolean;
}): IStage => {
    return { id, description, blocks, offsetTo, a_Transfer, a_Guarantee, b_Transfer, b_Guarantee, a_Approved, b_Approved, renderId: nanoid() } as IStage;
};

export const getSmartContractCode = (scresult: any) => {
    if (scresult.code) return scresult.code;
    return scresult?.stringkeys?.C ? scresult?.stringkeys?.C : '';
};
