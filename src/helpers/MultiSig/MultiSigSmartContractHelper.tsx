import store from 'store';
import ContractBuilder, { ContractMethod, IContractParameter } from '../ContractBuilder';
import {
    convertFormatIndependentToWalletAddress,
    convertToFormatIndependentDeroAddress,
    installSmartContract,
    isDeroAddress,
    parseDVMString,
    parseIntValuesString,
    scInvoke,
    scInvokeWithGasEstimate,
    waitForTransaction,
} from 'helpers/DeroHelper';
import { addSnackbar } from 'components/screen/Snackbars';
import { IS_DEBUG, MESSAGE_SEVERITY, SHOW_COMPARISON_ALWAYS } from 'Constants';
import { replacerWithPath } from 'helpers/Helper';
import { ContractLoadError, MultiSigContractLoadError } from 'customErrors';
import { getSmartContractCode } from 'helpers/ContractHelper';
import { setContract, setMultiSigSmartContractBalances } from 'hooks/multiSigHooks';
import { formatDero } from 'helpers/FormatHelper';
import { getAllSmartContractEntries, updateSmartContracts } from 'helpers/DirectoryHelper';
import { getColor } from 'helpers/ColorHelper';
import { isShowContractVerificationAlways, setBusyBackdrop } from 'hooks/mainHooks';
import { setCompareLoadContractResult } from 'components/common/dialogs/CompareSmartContractDialog';
import { getDeroInterface, getWalletAddress, updateWalletBalance } from 'hooks/deroHooks';
import LocalStorage from 'browserStorage/localStorage';

export const installMultiSigContract = async (contract: IMultiSigContract) => {
    setBusyBackdrop(true, 'Installing SmartContract...');
    try {
        const verificationResult = verifyContract(contract);
        if (verificationResult.valid) {
            const txid = await installSmartContract(contract.code!);
            addSnackbar({ message: `Contract submitted. Txid: ${txid}`, severity: MESSAGE_SEVERITY.INFO });
            await waitForTransaction(txid, true);
            addSnackbar({ message: `Contract installed successfully. Scid: ${txid}`, severity: MESSAGE_SEVERITY.SUCCESS });
            try {
                await loadContractAndSet(txid, false);
                updateSmartContracts();
            } catch (e) {
                if (e instanceof MultiSigContractLoadError) {
                    addSnackbar({ message: `This seems not to be a valid MultiSig-Contract.`, severity: MESSAGE_SEVERITY.ERROR });
                }
            }
        } else {
            addSnackbar({ message: `The MultiSig-Contract is not valid.`, severity: MESSAGE_SEVERITY.ERROR });
        }
    } catch (e) {
        addSnackbar({ message: `An error occurred installing the SmartContract.`, severity: MESSAGE_SEVERITY.ERROR });
    } finally {
        setBusyBackdrop(false);
        updateWalletBalance();
    }
};

export const verifyContract = (contract: IMultiSigContract) => {
    const errors: IVerificationDetails[] = [];
    const warnings: IVerificationDetails[] = [];

    if (contract.involvedParties.some((ip) => !isDeroAddress(ip.address))) {
        errors.push({
            message: 'Please make sure that every involved party has an address assigned.',
            details: 'Click on the involved party and paste the address into the textfield or type the name registered in the blockchain. You can also remove the party in the dialog.',
        });
    }
    if (contract.authorizationGroups.some((ag) => !ag.approvers.length)) {
        errors.push({ message: 'Every authorization-group needs at least one approver.', details: 'If this were not the case all of the approvers could approve a transaction' });
    }

    if (contract.authorizationGroups.every((ag) => ag.maximumWithdrawal)) {
        const maxWithdrawal = contract.authorizationGroups.reduce((acc, ag) => ag.maximumWithdrawal! + acc, 0);
        warnings.push({ message: 'All groups have a maximum withdrawal set.', details: 'You will never be able to withdraw more than ' + formatDero(maxWithdrawal) + '.' });
    }

    return { valid: errors.length == 0, errors, warnings } as IVerificationResult;
};

const createDescriptionContract = (contract: IMultiSigContract) => {
    return JSON.stringify(
        contract,
        replacerWithPath(function (field, value, path) {
            //console.log(path, '=', value);
            if (path === 'code' || path === 'compareCode' || path === 'scid') return undefined;
            if (field == 'proposedTransactions' || field == 'variables' || field === 'color' || field === 'isHovered') return undefined;
            return value;
        })
    );
};

export const createSmartContractCode = (contract: IMultiSigContract) => {
    const builder = new ContractBuilder();

    builder.addDescription(`// MultiSigContract - USE AT YOUR OWN RISK: ${createDescriptionContract(contract)}`);

    builder.addLineToInitializer(`IF EXISTS("CountAtomic")==0 THEN GOTO 3`);
    builder.addLineToInitializer(`RETURN 1`);
    builder.addLineToInitializer(`STORE("TotalBalance",0)`);
    builder.addLineToInitializer(`STORE("MaxTransactionsInAtomic",${contract.maxTransactionsInAtomic})`);
    builder.addLineToInitializer(`STORE("CountAtomic",0)`);
    builder.addLineToInitializer(`STORE("CountTransactions",0)`);
    builder.addLineToInitializer(`STORE("CountParties",4)`);

    contract.involvedParties.forEach((wallet, index) => {
        builder.addLineToInitializer(`STORE("Approver${index}","${wallet.address}")`);
    });
    contract.involvedParties.forEach((wallet, index) => {
        builder.addLineToInitializer(`STORE("RawApprover${index}",ADDRESS_RAW("${wallet.address}"))`);
    });

    builder.addLineToInitializer(`sendTokenToEachParty()`);

    let method: ContractMethod;

    method = builder.addMethod('Deposit', true);
    method.addLine(`STORE("TotalBalance",LOAD("TotalBalance")+DEROVALUE())`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('isInvolvedParty', false, [{ name: 'signer', type: 'String' }]);
    method.addLine(`DIM a,countParties as Uint64`);
    method.addLine(`LET a=0`);
    method.addLine(`LET countParties=LOAD("CountParties")`);
    method.addLine(`IF LOAD("RawApprover"+a)!=signer THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`LET a=a+1`);
    method.addLine(`IF a<countParties THEN GOTO 4`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('sendTokenToEachParty', false);
    method.addLine(`DIM scid as String`);
    method.addLine(`LET scid=SCID()`);
    contract.involvedParties.forEach((wallet, index) => {
        method.addLine(`SEND_ASSET_TO_ADDRESS(LOAD("RawApprover${index}"),1,scid)`);
    });
    method.addLine(`RETURN 0`);

    const withdrawalParams = [] as IContractParameter[];

    for (let a = 0; a < contract.maxTransactionsInAtomic; a++) {
        withdrawalParams.push({ name: 'account' + a, type: 'String' });
        withdrawalParams.push({ name: 'amount' + a, type: 'Uint64' });
    }

    method = builder.addMethod('ProposeWithdrawal', true, withdrawalParams);

    method.addLine(`DIM atomicId,startAtomic,endAtomic as Uint64`);
    method.addLine(`DIM signer as String`);
    method.addLine(`LET signer=SIGNER()`);
    method.addLine(`IF isInvolvedParty(signer)==1 THEN GOTO 6`);
    method.addLine(`RETURN 1`);
    method.addLine(`LET atomicId=LOAD("CountAtomic")+1`);
    method.addLine(`STORE("TransOwner_"+atomicId,signer)`);
    method.addLine(`STORE("TransOwnerAddress_"+atomicId,ADDRESS_STRING(signer))`);
    method.addLine(`LET startAtomic=LOAD("CountTransactions")+1`);
    method.addLine(`LET endAtomic=startAtomic`);
    method.addLine(`STORE("Start_"+atomicId,startAtomic)`);

    for (let a = 0; a < contract.maxTransactionsInAtomic; a++) {
        method.addLine(`LET endAtomic=registerTransactionForAtomic(endAtomic,account${a},amount${a})`);
    }

    method.addLine(`IF startAtomic<endAtomic THEN GOTO ${method.getNextAvailableLine() + 2}`);
    method.addLine(`RETURN 0`);

    method.addLine(`LET endAtomic=endAtomic-1`);
    method.addLine(`STORE("End_"+atomicId,endAtomic)`);
    method.addLine(`STORE("CountAtomic",atomicId)`);
    method.addLine(`STORE("CountTransactions",endAtomic)`);
    method.addLine(`STORE("TransState_"+atomicId,"PENDING")`);
    method.addLine(`STORE("TransRegister_"+HEX(TXID()),atomicId)`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('registerTransactionForAtomic', false, [
        { name: 'transId', type: 'Uint64' },
        { name: 'account', type: 'String' },
        { name: 'amount', type: 'Uint64' },
    ]);
    method.addLine(`IF IS_ADDRESS_VALID(ADDRESS_RAW(account))==1 && amount>0 THEN GOTO 3`);
    method.addLine(`RETURN transId`);
    method.addLine(`STORE("TransAccount_"+transId,account)`);
    method.addLine(`STORE("TransAmount_"+transId,amount)`);
    method.addLine(`RETURN transId+1`);

    method = builder.addMethod('CancelWithdrawal', true, [{ name: 'atomicId', type: 'Uint64' }]);
    method.addLine(`IF LOAD("TransOwner_"+atomicId)==SIGNER() && LOAD("TransState_"+atomicId)=="PENDING" THEN GOTO 3`);
    method.addLine(`RETURN 1`);
    method.addLine(`STORE("TransState_"+atomicId,"CANCELLED")`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('ApproveVote', true, [{ name: 'atomicId', type: 'Uint64' }]);
    method.addLine(`DIM signer,transState as String`);
    method.addLine(`LET signer=SIGNER()`);
    method.addLine(`IF EXISTS("TransState_"+atomicId)==1 && isInvolvedParty(signer)==1 THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`LET transState=LOAD("TransState_"+atomicId)`);
    method.addLine(`IF transState=="PENDING" THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`DIM totalTransactionAmount,blockheight as Uint64`);
    method.addLine(`LET blockheight=BLOCK_HEIGHT()`);
    method.addLine(`LET totalTransactionAmount=getTotal(atomicId)`);
    method.addLine(`loadApprovers(atomicId)`);
    method.addLine(`setApprovalState(atomicId,signer,"APPROVED")`);
    contract.authorizationGroups.forEach((authGroup, index) => {
        method.addLine(`IF checkAuthGroupApproval${index}(atomicId,totalTransactionAmount,blockheight)==1 THEN GOTO 1000`);
    });
    method.addLine('RETURN 0', 999);
    method.addLine('executeTransaction(atomicId)');
    method.addLine('STORE("TransState_"+atomicId,"DONE")');
    method.addLine('RETURN 0');

    method = builder.addMethod('loadApprovers', false, [{ name: 'atomicId', type: 'Uint64' }]);
    method.addLine(`DIM countParties,a as Uint64`);
    method.addLine(`DIM approverKey as String`);
    method.addLine(`LET countParties=LOAD("CountParties")`);
    method.addLine(`LET a=0`);
    method.addLine(`LET approverKey=getApproverKey(atomicId,LOAD("RawApprover"+a))`);
    method.addLine(`IF EXISTS(approverKey)==0 THEN GOTO 9`);
    method.addLine(`IF LOAD(approverKey)!="APPROVED" THEN GOTO ${method.jumpLine()}`);
    method.addLine(`MAPSTORE(approverKey,"APPROVED")`);
    method.addLine(`LET a=a+1`);
    method.addLine(`IF a<countParties THEN GOTO 5`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('setApprovalState', false, [
        { name: 'atomicId', type: 'Uint64' },
        { name: 'signer', type: 'String' },
        { name: 'state', type: 'String' },
    ]);
    method.addLine(`DIM approverKey as String`);
    method.addLine(`LET approverKey=getApproverKey(atomicId,signer)`);
    method.addLine(`IF state!="APPROVED" THEN GOTO ${method.jumpLine()}`);
    method.addLine(`MAPSTORE(approverKey,state)`);
    method.addLine(`STORE(approverKey,state)`);
    method.addLine(`LET approverKey=getApproverAddressKey(atomicId,ADDRESS_STRING(signer))`);
    method.addLine(`STORE(approverKey,state)`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('ResetVote', true, [{ name: 'atomicId', type: 'Uint64' }]);
    method.addLine(`DIM signer,transState as String`);
    method.addLine(`LET signer=SIGNER()`);
    method.addLine(`LET transState=LOAD("TransState_"+atomicId)`);
    method.addLine(`IF transState=="PENDING" THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`DELETE(getApproverKey(atomicId,signer))`);
    method.addLine(`DELETE(getApproverAddressKey(atomicId,ADDRESS_STRING(signer)))`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('RejectVote', true, [{ name: 'atomicId', type: 'Uint64' }]);
    method.addLine(`DIM signer,transState as String`);
    method.addLine(`LET signer=SIGNER()`);
    method.addLine(`IF EXISTS("TransState_"+atomicId)==1 && isInvolvedParty(signer)==1 THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`LET transState=LOAD("TransState_"+atomicId)`);
    method.addLine(`IF transState=="PENDING" THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`setApprovalState(atomicId,signer,"REJECTED")`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod(
        'getApproverKey',
        false,
        [
            { name: 'atomicId', type: 'Uint64' },
            { name: 'signer', type: 'String' },
        ],
        'String'
    );
    method.addLine(`RETURN "APPROVER_"+atomicId+"_"+signer`);

    method = builder.addMethod(
        'getApproverAddressKey',
        false,
        [
            { name: 'atomicId', type: 'Uint64' },
            { name: 'address', type: 'String' },
        ],
        'String'
    );
    method.addLine(`RETURN "APPROVERADDRESS_"+atomicId+"_"+SUBSTR(address,4,56)`);

    method = builder.addMethod('getTotal', false, [{ name: 'atomicId', type: 'Uint64' }]);
    method.addLine(`DIM startAtomic,endAtomic,transId,totalAmount as Uint64`);
    method.addLine(`LET startAtomic=LOAD("Start_"+atomicId)`);
    method.addLine(`LET endAtomic=LOAD("End_"+atomicId)`);
    method.addLine(`LET transId=startAtomic`);
    method.addLine(`LET totalAmount=0`);
    method.addLine(`LET totalAmount=totalAmount+LOAD("TransAmount_"+transId)`);
    method.addLine(`LET transId=transId+1`);
    method.addLine(`IF transId<=endAtomic THEN GOTO 6`);
    method.addLine(`RETURN totalAmount `);

    method = builder.addMethod('executeTransaction', false, [{ name: 'atomicId', type: 'Uint64' }]);
    method.addLine(`DIM startAtomic,endAtomic,transId,amount as Uint64`);
    method.addLine(`DIM account as String`);
    method.addLine(`LET startAtomic=LOAD("Start_"+atomicId)`);
    method.addLine(`LET endAtomic=LOAD("End_"+atomicId)`);
    method.addLine(`LET transId=startAtomic`);
    method.addLine(`LET account=LOAD("TransAccount_"+transId)`);
    method.addLine(`LET amount=LOAD("TransAmount_"+transId)`);
    method.addLine(`SEND_DERO_TO_ADDRESS(ADDRESS_RAW(account),amount)`);
    method.addLine(`LET transId=transId+1`);
    method.addLine(`IF transId<=endAtomic THEN GOTO 6`);
    method.addLine(`RETURN 0 `);

    contract.authorizationGroups.forEach((authGroup, index) => {
        const additionalApprovedLines: string[] = [];
        method = builder.addMethod(`checkAuthGroupApproval${index}`, false, [
            { name: 'atomicId', type: 'Uint64' },
            { name: 'totalTransactionAmount', type: 'Uint64' },
            { name: 'blockheight', type: 'Uint64' },
        ]);
        if (authGroup.maximumWithdrawal) {
            builder.addLineToInitializer(`STORE("WithdrawnGroup${index}",0)`);
            method.addLine('DIM withdrawn as Uint64');
            method.addLine(`LET withdrawn=LOAD("WithdrawnGroup${index}")`);
            method.addLine(`IF withdrawn+totalTransactionAmount>${authGroup.maximumWithdrawal} THEN GOTO 2000`);
            additionalApprovedLines.push(`STORE("WithdrawnGroup${index}",withdrawn+totalTransactionAmount)`);
        }
        if (authGroup.withdrawalStartIn || (authGroup.furtherDelay && authGroup.furtherDelay.length > 0)) {
            builder.addLineToInitializer(`STORE("WithdrawBlock${index}",BLOCK_HEIGHT()+${authGroup.withdrawalStartIn ?? 0})`);
            method.addLine(`IF blockheight<LOAD("WithdrawBlock${index}") THEN GOTO 2000`);
        }
        method.addLine(`DIM approverCount as Uint64`);
        if (authGroup.requiredApprovers && authGroup.requiredApprovers > 1) {
            authGroup.approvers.forEach((approver) => {
                const involvedPartyIndex = contract.involvedParties.findIndex((involvedParty) => involvedParty.id == approver.wallet.id);
                method.addLine(`IF MAPEXISTS(getApproverKey(atomicId,LOAD("RawApprover${involvedPartyIndex}")))==0 THEN GOTO ${method.lastLineNumber + 3}`);
                method.addLine(`LET approverCount=approverCount+1`);
            });
            method.addLine(`IF approverCount<${authGroup.requiredApprovers} THEN GOTO 2000`);
        } else {
            authGroup.approvers.forEach((approver) => {
                const involvedPartyIndex = contract.involvedParties.findIndex((involvedParty) => involvedParty.id == approver.wallet.id);
                method.addLine(`IF MAPEXISTS(getApproverKey(atomicId,LOAD("RawApprover${involvedPartyIndex}")))==0 THEN GOTO ${method.lastLineNumber + 3}`);
                method.addLine(`LET approverCount=approverCount+1`);
            });
            method.addLine(`IF approverCount==0 THEN GOTO 2000`);
        }

        let lineNumber = 1000;
        additionalApprovedLines.forEach((l) => {
            method.addLine(l, lineNumber++);
        });

        method.addLine('RETURN 1', lineNumber);

        method.addLine('RETURN 0', 2000);

        if (authGroup.furtherDelay && authGroup.furtherDelay.length > 0) {
            method = builder.addMethod(`UpdateBlockheightAuthGroup${index}`, true, [{ name: 'additionalBlocks', type: 'Uint64' }]);
            method.addLine(`DIM signer as String`);
            method.addLine(`LET signer=SIGNER()`);

            const goToLine = authGroup.furtherDelay.length + 4;

            authGroup.furtherDelay.forEach((f) => {
                const rawApproverIndex = contract.involvedParties.findIndex((ip) => ip.id === f.id);
                method.addLine(`IF signer==LOAD("RawApprover${rawApproverIndex}") THEN GOTO ${goToLine}`);
            });

            method.addLine(`RETURN 1`);

            method.addLine(`DIM withdrawBlock,currentBlockheight as Uint64`);
            method.addLine(`LET withdrawBlock=LOAD("WithdrawBlock${index}")`);
            method.addLine(`LET currentBlockheight=BLOCK_HEIGHT()`);
            method.addLine(`IF currentBlockheight<withdrawBlock THEN GOTO ${method.jumpLine()}`);
            method.addLine(`LET withdrawBlock=currentBlockheight`);
            method.addLine(`STORE("WithdrawBlock${index}",withdrawBlock+additionalBlocks)`);
            method.addLine(`RETURN 0`);
        }
    });

    builder.addLineToInitializer(`RETURN 0`);

    return builder.build();
};

export const loadContract = async (scid: string): Promise<ILoadContractResult> => {
    try {
        console.log('Trying to load', scid);
        const result = await getDeroInterface().getSmartContract({ scid, code: true, variables: true });

        const regex = /\/\/ MultiSigContract - USE AT YOUR OWN RISK: (.*)/m;
        const match = getSmartContractCode(result).match(regex);
        const jsonString = match ? match[1].trim() : null;

        if (!jsonString) {
            throw new MultiSigContractLoadError();
        }
        const parsedContract = JSON.parse(jsonString) as IMultiSigContract;
        parsedContract.scid = scid;
        parsedContract.code = result.code;
        parsedContract.compareCode = createSmartContractCode(parsedContract);

        if (result.stringkeys) {
            parsedContract.ownerAddress = result.stringkeys[`OwnerAddress`] as string;

            parsedContract.authorizationGroups.forEach((ag, index) => {
                const withdrawPropertyName = `WithdrawBlock${index}`;

                if (result.stringkeys && result.stringkeys.hasOwnProperty(withdrawPropertyName)) {
                    ag.withdrawalBlockheight = result.stringkeys[withdrawPropertyName] as number;
                    ag.withdrawalStartIn = undefined;
                }
            });
        }

        parsedContract.involvedParties = parsedContract.involvedParties
            .sort((a, b) => a.alias?.localeCompare(b.alias) ?? 1)
            .map((wallet, index, array) => {
                wallet.color = getColor(index, array.length);
                return wallet;
            });

        parsedContract.authorizationGroups.forEach((ag) => {
            ag.approvers.forEach((approver) => {
                const walletIp = parsedContract.involvedParties.find((ip) => ip.id === approver.wallet.id);
                approver.wallet.color = walletIp?.color!;
            });
        });

        parsedContract.proposedTransactions = parseTransactions(result.stringkeys, parsedContract).sort((a, b) => b.atomicId! - a.atomicId!);

        return { contract: parsedContract, balances: result.balances! };
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
            setVerifiedMultiSigContractAndBalances({ contract, balances });
            LocalStorage.setLastOpenedMultiSigContract(contract.scid!);
            if (validation) {
                addSnackbar({ message: `The contract was loaded successfully.`, severity: MESSAGE_SEVERITY.SUCCESS });
            }
        }
    } catch (e) {
        addSnackbar({ message: `Error loading the contract.`, severity: MESSAGE_SEVERITY.ERROR });
    }
};

export const setVerifiedMultiSigContractAndBalances = ({ contract, balances }: ILoadContractResult) => {
    setContract(contract as IMultiSigContract);
    setMultiSigSmartContractBalances(balances);
    updateSmartContracts();
};

const parseTransactions = (stringkeys: { [key: string]: string | number } | undefined, contract: IMultiSigContract): IAtomicTransaction[] => {
    if (!stringkeys) {
        return [];
    }

    const atomicTransactions = Object.keys(stringkeys)
        .filter((key) => key.startsWith('TransRegister_'))
        .reduce((acc, key) => {
            const txid = key.substring(14);
            const atomicId = stringkeys[key] as Uint64;

            const startAtomic = stringkeys[`Start_${atomicId}`] as Uint64;
            const endAtomic = stringkeys[`End_${atomicId}`] as Uint64;

            const approverKeyStart = `APPROVERADDRESS_${atomicId}_`;

            let transactions = new Array<ITransaction>();

            for (let a = startAtomic; a <= endAtomic; a++) {
                const account = stringkeys[`TransAccount_${a}`] as string;
                const amount = stringkeys[`TransAmount_${a}`] as Uint64;
                transactions.push({ address: account, amount });
            }

            const approvalStatus = Object.keys(stringkeys)
                .filter((key) => key.startsWith(approverKeyStart))
                .reduce((acc, key) => {
                    const signer = key.substring(approverKeyStart.length);
                    const status = stringkeys[key] as ApprovalType;
                    acc[convertFormatIndependentToWalletAddress(signer, contract.involvedParties)] = status;
                    return acc;
                }, {} as IApprovalStatus);

            contract.involvedParties.forEach((ip) => {
                if (ip.address && !approvalStatus[ip.address]) {
                    approvalStatus[ip.address] = '';
                }
            });

            const createdBy = stringkeys[`TransOwnerAddress_${atomicId}`] as string;
            const state = stringkeys[`TransState_${atomicId}`] as TransactionStateType;

            acc.push({ txid, atomicId, approvalStatus, transactions, createdBy, state });
            return acc;
        }, new Array<IAtomicTransaction>());

    console.log('atomicTransactions', atomicTransactions);
    return atomicTransactions;
};

export const proposeTransaction = async (scid: Hash, transactionList: ITransaction[]) => {
    const sc_rpc = new Array<IRpc_Arguments>();

    transactionList.forEach((t, index) => {
        sc_rpc.push({ name: `account${index}`, datatype: 'S', value: t.address });
        sc_rpc.push({ name: `amount${index}`, datatype: 'U', value: t.amount });
    });

    const signer = getWalletAddress() ?? undefined;

    const txid = await scInvokeWithGasEstimate({ scid, entrypoint: 'ProposeWithdrawal', sc_rpc, signer, waitFor: true });

    return txid;
};

export const loadTransaction = async (contract: IMultiSigContract, txid: Hash) => {
    if (!contract.scid) return null;
    const scid = contract.scid;
    //console.log('req', { scid, keysstring: [`TransRegister_${txid}`], code: false, variables: false });
    let response = await getDeroInterface().getSmartContract({ scid, keysstring: [`TransRegister_${txid}`], code: false, variables: false });

    //console.log('res', response);

    const atomicId = parseIntValuesString(response.valuesstring!, 0);
    console.log('atomicId', atomicId);

    if (!atomicId) return null;

    response = await getDeroInterface().getSmartContract({
        scid,
        keysstring: [`TransOwnerAddress_${atomicId}`, `TransState_${atomicId}`, `Start_${atomicId}`, `End_${atomicId}`],
        code: false,
        variables: false,
    });
    const createdBy = parseDVMString(response.valuesstring!, 0);
    const state = parseDVMString(response.valuesstring!, 1);
    const startAtomic = parseIntValuesString(response.valuesstring!, 2) as Uint64;
    const endAtomic = parseIntValuesString(response.valuesstring!, 3) as Uint64;

    const keysstringForTransactions = new Array<string>();
    for (let a = startAtomic; a <= endAtomic; a++) {
        keysstringForTransactions.push(`TransAccount_${a}`);
        keysstringForTransactions.push(`TransAmount_${a}`);
    }
    contract.involvedParties.forEach((ip) => {
        const key = getApproverAddressKey(atomicId, ip.address!);
        keysstringForTransactions.push(key);
    });

    response = await getDeroInterface().getSmartContract({
        scid,
        keysstring: keysstringForTransactions,
        code: false,
        variables: false,
    });

    const transactions = new Array<ITransaction>();

    for (let a = startAtomic, x = 0; a <= endAtomic; a++, x = x + 2) {
        const address = parseDVMString(response.valuesstring!, x);
        const amount = parseIntValuesString(response.valuesstring!, x + 1) as Uint64;
        transactions.push({ address, amount } as ITransaction);
    }

    const keysstring: string[] = [];
    contract.involvedParties.forEach((ip) => {
        const signer = convertToFormatIndependentDeroAddress(ip.address!);
        keysstring.push(`APPROVERADDRESS_${atomicId}_${signer}`);
    });

    response = await getDeroInterface().getSmartContract({
        scid,
        keysstring,
        code: false,
        variables: false,
    });

    const approvalStatus: { [key: string]: ApprovalType } = {};

    contract.involvedParties.forEach((ip, index) => {
        const status = parseDVMString(response.valuesstring!, index) as ApprovalType | null;
        approvalStatus[ip.address!] = status ?? '';
    });

    return {
        txid,
        atomicId,
        transactions,
        approvalStatus,
        createdBy,
        state,
    } as IAtomicTransaction;
};

const getApproverAddressKey = (atomicId: Uint64, address: string) => {
    return `APPROVERADDRESS_${atomicId}_${convertToFormatIndependentDeroAddress(address)}`;
};

export const approveTransaction = async (contract: IMultiSigContract, atomicTransaction: IAtomicTransaction, entrypoint: string = 'ApproveVote') => {
    const txid = await scInvoke({ scid: contract.scid!, entrypoint, sc_rpc: [{ name: `atomicId`, datatype: 'U', value: atomicTransaction.atomicId! }], waitFor: true });
    const { contract: newContract, balances } = await loadContract(contract.scid!);
    contract = newContract as IMultiSigContract;
    setContract(contract);
    setMultiSigSmartContractBalances(balances);

    return contract.proposedTransactions.find((t) => t.txid === atomicTransaction.txid) as IAtomicTransaction;
};

export const getInvolvedParties: (contract: IMultiSigContract) => IWallet[] = (contract) => {
    const involvedParties: IWallet[] = [...contract.involvedParties];

    const currentlyUsedWallets = contract.authorizationGroups.reduce((acc, ag) => {
        ag.approvers
            .map((ap) => ap.wallet)
            .forEach((wallet) => {
                acc.push(wallet);
            });
        return acc;
    }, new Array<IWallet>());

    let newlyInvolvedParties = involvedParties.reduce((acc, wallet) => {
        const isFound = currentlyUsedWallets.some((w) => wallet.id === w.id);
        if (!isFound) {
            acc.push(wallet);
        }
        return acc;
    }, new Array<IWallet>());

    return currentlyUsedWallets
        .concat(newlyInvolvedParties)
        .sort((a, b) => a.alias?.localeCompare(b.alias) ?? 1)
        .map((wallet, index, array) => {
            wallet.color = getColor(index, array.length);
            return wallet;
        });
};

export const reassignColors = (contract: IMultiSigContract) => {
    //use only from within redux
    contract.involvedParties.forEach((wallet, index, array) => {
        const color = getColor(index, array.length);
        wallet.color = color;

        contract.authorizationGroups.forEach((ag) => {
            ag.approvers.forEach((approver) => {
                const walletAG = approver.wallet;
                if (walletAG.id === wallet.id) {
                    walletAG.color = color;
                }
            });
        });
    });
};

export const getApproverDraggableId = (approver: IApprover) => `draggable_approver_${approver.id}`;
export const getInvolvedPartyDraggableId = (wallet: IWallet) => `involvedParty_wallet_${wallet.id}`;

export const addTimeForWithdrawal = async (scid: string, authGroupIndex: number, additionalBlocks: Uint64) => {
    let sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'additionalBlocks', datatype: 'U', value: additionalBlocks });

    const txid = await scInvoke({ scid, entrypoint: `UpdateBlockheightAuthGroup${authGroupIndex}`, sc_rpc, waitFor: true });

    return txid;
};
