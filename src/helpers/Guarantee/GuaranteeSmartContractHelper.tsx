import { calculateEstimatedDate, getGasEstimate, installSmartContract, scInvoke, scInvokeWithGasEstimate, waitForTransaction } from 'helpers/DeroHelper';
import ContractBuilder, { ContractMethod, IContractParameter } from '../ContractBuilder';
import { addSnackbar } from 'components/screen/Snackbars';
import { isShowContractVerificationAlways, setBusyBackdrop } from 'hooks/mainHooks';
import { updateSmartContracts } from 'helpers/DirectoryHelper';
import { IS_DEBUG, MESSAGE_SEVERITY, SHOW_COMPARISON_ALWAYS } from 'Constants';
import store from 'store';
import { calcStageDependencies } from './DependencyGraphCalc';
import { replacerWithPath } from 'helpers/Helper';
import { getSmartContractCode } from 'helpers/ContractHelper';
import { ContractLoadError, GuaranteeContractLoadError } from 'customErrors';
import { hex_to_ascii } from 'helpers/StringHelper';
import { setContract, setGuaranteeSmartContractBalances } from 'hooks/guaranteeHooks';
import { nanoid } from 'nanoid';
import { setCompareLoadContractResult } from 'components/common/dialogs/CompareSmartContractDialog';
import { convertBlocksToFormattedTime, convertBlocksToYearsMonthsDaysHours, formatNumber } from 'helpers/FormatHelper';
import { Dayjs } from 'dayjs';
import { getColor } from 'helpers/ColorHelper';
import { getDeroInterface, updateWalletBalance } from 'hooks/deroHooks';
import LocalStorage from 'browserStorage/localStorage';

export const installGuaranteeContract = async (contract: IGuaranteeContract) => {
    setBusyBackdrop(true, 'Installing SmartContract...');
    try {
        const verificationResult = verifyContract(contract);
        if (verificationResult.errors.length === 0) {
            const txid = await installSmartContract(contract.code!);
            addSnackbar({ message: `Contract submitted. Txid: ${txid}`, severity: MESSAGE_SEVERITY.INFO });
            await waitForTransaction(txid, true);
            addSnackbar({ message: `Contract installed successfully. Scid: ${txid}`, severity: MESSAGE_SEVERITY.SUCCESS });
            try {
                await loadContractAndSet(txid, false);
            } catch (e) {
                if (e instanceof GuaranteeContractLoadError) {
                    addSnackbar({ message: `This seems not to be a valid Guarantee-Contract.`, severity: MESSAGE_SEVERITY.ERROR });
                }
            }
        } else {
            addSnackbar({ message: `The Guarantee-Contract is not valid.`, severity: MESSAGE_SEVERITY.ERROR });
        }
    } catch (e) {
        addSnackbar({ message: `An error occurred installing the SmartContract.`, severity: MESSAGE_SEVERITY.ERROR });
    } finally {
        setBusyBackdrop(false);
        updateWalletBalance();
    }
};

export const verifyContract = (contract: IGuaranteeContract) => {
    const errors: IVerificationDetails[] = [];
    const warnings: IVerificationDetails[] = [];

    if (contract.stages.length === 0) {
        errors.push({
            message: 'No stage defined.',
            details:
                'Stages have all the necessary information regarding how much money in guarantees has to be deposited and which transfers take place after approval. At least one stage is required',
        });
    }
    if (contract.stages.every((s) => s.a_Guarantee + s.b_Guarantee + s.a_Transfer + s.b_Transfer === 0)) {
        errors.push({ message: 'All Guarantees and Transfers are 0', details: 'This contract does not make sense, why would someone be eager to have a stage with 0 money approved.' });
    }

    if (!contract.firstPartyWallet?.address && !contract.secondPartyWallet?.address) {
        errors.push({ message: 'No parties defined', details: 'At least Party A needs to be defined.' });
    }

    if (!contract.secondPartyWallet?.address) {
        warnings.push({
            message: 'Anyone who pays can be Party B',
            details:
                'This contract has not defined Party B. This means that anyone who deposits the RequiredDeposit-amount can be Party B and if you as Party A have done your deposit the contract will be in effect.',
        });
    }

    if (!contract.description) {
        warnings.push({
            message: 'No description for the purpose of the contract defined',
            details: 'Make it clear what you expect the other party to do. If not there can be disagreements easily.',
        });
    }

    if (contract.stages.some((s) => s.a_Guarantee + s.b_Guarantee + s.a_Transfer + s.b_Transfer === 0)) {
        warnings.push({ message: 'Some stages with 0 value', details: 'You can remove empty stages, if you do not use them for example as common dependencies for kicking off other stages.' });
    }

    if (contract.stages.some((s) => !s.description)) {
        warnings.push({ message: 'Some stages have no description', details: 'Make it clear what you expect the other party to do. If not there can be disagreements easily.' });
    }

    return { valid: errors.length == 0, errors, warnings } as IVerificationResult;
};

export const createSmartContractCode = (contract: IGuaranteeContract) => {
    const builder = new ContractBuilder();

    let method: ContractMethod;
    const aTotalToBeDeposited = contract.stages.reduce((acc, stage) => acc + stage.a_Guarantee + stage.a_Transfer, 0);
    const bTotalToBeDeposited = contract.stages.reduce((acc, stage) => acc + stage.b_Guarantee + stage.b_Transfer, 0);

    const bIsUndefined = contract.secondPartyWallet?.address ? false : true;

    builder.addDescription(`// GuaranteeContract - USE AT YOUR OWN RISK: ${createDescriptionContract(contract)}`);

    builder.addLineToInitializer(`IF EXISTS("Owner")==0 THEN GOTO 3`);
    builder.addLineToInitializer(`RETURN 1`);
    builder.addLineToInitializer(`DIM signer as String`);
    builder.addLineToInitializer(`LET signer=SIGNER()`);
    builder.addLineToInitializer(`STORE("Owner",signer)`);
    builder.addLineToInitializer(`STORE("OwnerAddress",ADDRESS_STRING(signer))`);
    builder.addLineToInitializer(`STORE("NumberOfStages",${contract.stages.length})`);
    builder.addLineToInitializer(`STORE("PartyA_TotalToBeDeposited",${aTotalToBeDeposited})`);
    builder.addLineToInitializer(`STORE("PartyB_TotalToBeDeposited",${bTotalToBeDeposited})`);
    builder.addLineToInitializer(`STORE("PartyA_Deposited",0)`);
    builder.addLineToInitializer(`STORE("PartyB_Deposited",0)`);
    builder.addLineToInitializer(`STORE("State","PENDING_DEPOSITS")`);
    builder.addLineToInitializer(`STORE("Description","${contract.description ?? ''}")`);
    builder.addLineToInitializer(`STORE("PartyA_Address","${contract.firstPartyWallet?.address}")`);
    if (!bIsUndefined) builder.addLineToInitializer(`STORE("PartyB_Address","${contract.secondPartyWallet?.address}")`);
    builder.addLineToInitializer(`STORE("PartyA_RawAddress",ADDRESS_RAW("${contract.firstPartyWallet?.address}"))`);
    if (!bIsUndefined) builder.addLineToInitializer(`STORE("PartyB_RawAddress",ADDRESS_RAW("${contract.secondPartyWallet?.address}"))`);

    contract.stages.forEach((stage) => {
        builder.addLineToInitializer(`STORE("Stage_${stage.id}_Description","${stage.description ?? ''}")`);
        builder.addLineToInitializer(`STORE("Stage_${stage.id}_OffsetTo",${stage.offsetTo && stage.offsetTo > 0 ? stage.offsetTo : 0})`);
        builder.addLineToInitializer(`STORE("Stage_${stage.id}_Blocks",${stage.blocks})`);

        builder.addLineToInitializer(`STORE("Stage_${stage.id}_A_Transfer",${stage.a_Transfer})`);
        builder.addLineToInitializer(`STORE("Stage_${stage.id}_A_Guarantee",${stage.a_Guarantee})`);
        builder.addLineToInitializer(`STORE("Stage_${stage.id}_B_Transfer",${stage.b_Transfer})`);
        builder.addLineToInitializer(`STORE("Stage_${stage.id}_B_Guarantee",${stage.b_Guarantee})`);
        builder.addLineToInitializer(`STORE("Stage_${stage.id}_A_Approved",0)`);
        builder.addLineToInitializer(`STORE("Stage_${stage.id}_B_Approved",0)`);
    });

    const directInstallStages = contract.stages.filter((s) => s.offsetTo === -2);

    if (directInstallStages.length > 0) {
        builder.addLineToInitializer(`DIM blockheight as Uint64`);
        builder.addLineToInitializer(`LET blockheight=BLOCK_HEIGHT()`);
    }

    directInstallStages.forEach((stage) => {
        if (stage.blocks > 0 && stage.offsetTo === -2) {
            builder.addLineToInitializer(`STORE("Stage_${stage.id}_MaxBlockheight",blockheight+${stage.blocks})`);
            builder.addLineToInitializer(`STORE("Stage_${stage.id}_FinishedBlockheight",0)`);
        }
    });

    if (!bIsUndefined) {
        builder.addLineToInitializer(`sendTokenToEachParty()`);
    } else {
        builder.addLineToInitializer(`sendTokenToParty("A")`);
    }

    builder.addLineToInitializer(`RETURN 0`);

    if (!bIsUndefined) {
        method = builder.addMethod('sendTokenToEachParty');
        method.addLine(`DIM scid as String`);
        method.addLine(`LET scid=SCID()`);
        method.addLine(`SEND_ASSET_TO_ADDRESS(LOAD("PartyA_RawAddress"),1,scid)`);
        method.addLine(`SEND_ASSET_TO_ADDRESS(LOAD("PartyB_RawAddress"),1,scid)`);
        method.addLine(`RETURN 0`);
    } else {
        method = builder.addMethod('sendTokenToParty', false, [{ name: 'party', type: 'String' }]);
        method.addLine(`SEND_ASSET_TO_ADDRESS(LOAD("Party"+party+"_RawAddress"),1,SCID())`);
        method.addLine(`RETURN 0`);
    }

    method = builder.addMethod('getParty', false, [{ name: 'signer', type: 'String' }], 'String');
    method.addLine(`IF signer!=LOAD("PartyA_RawAddress") THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN "A"`);

    if (bIsUndefined) {
        method.addLine(`IF EXISTS("PartyB_RawAddress")==1 THEN GOTO ${method.jumpLine() + 2}`);
        method.addLine(`STORE("PartyB_Address",ADDRESS_STRING(signer))`);
        method.addLine(`STORE("PartyB_RawAddress",signer)`);
        method.addLine(`RETURN "B"`);
    }

    method.addLine(`IF signer!=LOAD("PartyB_RawAddress") THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN "B"`);
    method.addLine(`PANIC`);

    method = builder.addMethod('Deposit', true);
    method.addLine(`IF LOAD("State")=="PENDING_DEPOSITS" THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`DIM signer,party as String`);
    method.addLine(`DIM deposited as Uint64`);
    method.addLine(`LET signer=SIGNER()`);
    method.addLine(`LET party=getParty(signer)`);
    method.addLine(`LET deposited=DEROVALUE()`);
    method.addLine(`IF deposited==LOAD("Party"+party+"_TotalToBeDeposited") && LOAD("Party"+party+"_Deposited")==0 THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`STORE("Party"+party+"_Deposited",deposited)`);
    method.addLine(`checkStateActivation(party)`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('Withdraw', true);
    method.addLine(`DIM signer,party as String`);
    method.addLine(`DIM deposited as Uint64`);
    method.addLine(`LET signer=SIGNER()`);
    method.addLine(`LET party=getParty(signer)`);
    method.addLine(`LET deposited=LOAD("Party"+party+"_Deposited")`);
    method.addLine(`IF LOAD("State")=="PENDING_DEPOSITS" && deposited>0 THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`SEND_DERO_TO_ADDRESS(signer,deposited)`);
    method.addLine(`STORE("Party"+party+"_Deposited",0)`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('checkStateActivation', false, [{ name: 'party', type: 'String' }]);
    method.addLine(`IF party=="A" THEN GOTO ${method.jumpLine() + 1}`);
    method.addLine(`IF LOAD("PartyA_Deposited")>0 THEN GOTO 6`);
    method.addLine(`RETURN 0`);
    method.addLine(`IF LOAD("PartyB_Deposited")>0 THEN GOTO 6`);
    method.addLine(`RETURN 0`);
    method.addLine(`STORE("State", "STARTED")`);
    method.addLine(`initMaxBlockHeights()`);
    method.addLine(`RETURN 0`);

    const dependencyMap = calcStageDependencies(contract);

    method = builder.addMethod('initMaxBlockHeights');
    if (contract.stages.some((s) => (s.offsetTo ?? 0) < 0)) {
        method.addLine(`DIM blockheight as Uint64`);
        method.addLine(`LET blockheight=BLOCK_HEIGHT()`);
    }
    contract.stages.forEach((stage) => {
        if (stage.blocks > 0 && stage.offsetTo === -1) {
            method.addLine(`STORE("Stage_${stage.id}_MaxBlockheight",blockheight+${stage.blocks})`);
            method.addLine(`STORE("Stage_${stage.id}_FinishedBlockheight",0)`);
        } else if (stage.blocks === 0 && !stage.offsetTo) {
            method.addLine(`STORE("Stage_${stage.id}_MaxBlockheight",0)`);
            method.addLine(`STORE("Stage_${stage.id}_FinishedBlockheight",0)`);
        } else if (stage.blocks > 0 && !stage.offsetTo) {
            method.addLine(`STORE("Stage_${stage.id}_MaxBlockheight",${stage.blocks})`);
            method.addLine(`STORE("Stage_${stage.id}_FinishedBlockheight",0)`);
        }
    });
    contract.stages.forEach((stage) => {
        if (stage.offsetTo && stage.offsetTo > 0) {
            let currentStage = stage;
            let dynamicAccumulatedBlocks = 0;
            while (currentStage?.offsetTo) {
                dynamicAccumulatedBlocks += currentStage.blocks;
                currentStage = contract.stages.find((s) => s.id === currentStage.offsetTo)!;
                if (currentStage && !((currentStage.offsetTo ?? 0) > 0)) {
                    dynamicAccumulatedBlocks += currentStage.blocks;
                }
            }
            method.addLine(`STORE("Stage_${stage.id}_MaxBlockheight",${dynamicAccumulatedBlocks})`);
            method.addLine(`STORE("Stage_${stage.id}_FinishedBlockheight",0)`);
        }
    });
    method.addLine(`RETURN 0`);

    method = builder.addMethod('Approve', true, [{ name: 'stage', type: 'Uint64' }]);
    method.addLine(`IF LOAD("State")=="STARTED" THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`DIM signer,party as String`);
    method.addLine(`LET signer=SIGNER()`);
    method.addLine(`LET party=getParty(signer)`);
    method.addLine(`IF LOAD("Stage_"+stage+"_"+party+"_Approved")==0 THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`STORE("Stage_"+stage+"_"+party+"_Approved",1)`);
    method.addLine(`IF party=="B" THEN GOTO ${method.jumpLine() + 1}`);
    method.addLine(`IF LOAD("Stage_"+stage+"_B_Approved")==1 THEN GOTO 1000`);
    method.addLine(`RETURN 0`);
    method.addLine(`IF LOAD("Stage_"+stage+"_A_Approved")==1 THEN GOTO 1000`);
    method.addLine(`RETURN 0`);
    method.addLine(`finalizeStage(stage)`, 1000);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('ResetVote', true, [{ name: 'stage', type: 'Uint64' }]);
    method.addLine(`IF LOAD("State")=="STARTED" THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`DIM signer,party as String`);
    method.addLine(`LET signer=SIGNER()`);
    method.addLine(`LET party=getParty(signer)`);
    method.addLine(`IF party=="B" THEN GOTO 9`);
    method.addLine(`IF LOAD("Stage_"+stage+"_B_Approved")==1 THEN GOTO 12`);
    method.addLine(`GOTO 10`);
    method.addLine(`IF LOAD("Stage_"+stage+"_A_Approved")==1 THEN GOTO 12`);
    method.addLine(`STORE("Stage_"+stage+"_"+party+"_Approved",0)`);
    method.addLine(`RETURN 0`);
    method.addLine(`RETURN 1`);

    method = builder.addMethod('finalizeStage', false, [{ name: 'stage', type: 'Uint64' }]);
    method.addLine(`DIM partyAraw,partyBraw as String`);
    method.addLine(`LET partyAraw=LOAD("PartyA_RawAddress")`);
    method.addLine(`LET partyBraw=LOAD("PartyB_RawAddress")`);
    method.addLine(`SEND_DERO_TO_ADDRESS(partyAraw,LOAD("Stage_"+stage+"_B_Transfer")+LOAD("Stage_"+stage+"_A_Guarantee"))`);
    method.addLine(`SEND_DERO_TO_ADDRESS(partyBraw,LOAD("Stage_"+stage+"_A_Transfer")+LOAD("Stage_"+stage+"_B_Guarantee"))`);

    for (const [closedStageId] of dependencyMap) {
        method.addLine(`IF stage!=${closedStageId} THEN GOTO ${method.jumpLine()}`);
        method.addLine(`updateStage${closedStageId}Dependencies()`);
    }

    method.addLine(`RETURN 0`);

    for (const [closedStageId, dependencies] of dependencyMap) {
        const closedStage = contract.stages.find((s) => s.id === closedStageId)!;

        method = builder.addMethod(`updateStage${closedStageId}Dependencies`);
        method.addLine(`DIM maxBlockheight,finishedBlockheight,anticipateBlocks as Uint64`);
        method.addLine(`LET maxBlockheight=LOAD("Stage_${closedStageId}_MaxBlockheight")`);
        method.addLine(`LET finishedBlockheight=BLOCK_HEIGHT()`);
        method.addLine(`IF finishedBlockheight<=maxBlockheight THEN GOTO ${method.jumpLine()}`);
        method.addLine(`PANIC`);
        method.addLine(`STORE("Stage_${closedStageId}_FinishedBlockheight",finishedBlockheight)`);
        method.addLine(`LET anticipateBlocks=maxBlockheight-finishedBlockheight`);

        contract.stages
            .filter((s) => s.offsetTo === closedStageId)
            .forEach((s) => {
                method.addLine(`updateStage${s.id}(anticipateBlocks)`);
            });

        method.addLine(`RETURN 0`);
    }

    contract.stages
        .filter((s) => s.offsetTo && s.offsetTo > 0)
        .forEach((s) => {
            method = builder.addMethod(`updateStage${s.id}`, false, [{ name: 'anticipateBlocks', type: 'Uint64' }]);

            method.addLine(`IF LOAD("Stage_${s.id}_FinishedBlockheight")==0 THEN GOTO ${method.jumpLine()}`);
            method.addLine(`RETURN 0`);
            method.addLine(`STORE("Stage_${s.id}_MaxBlockheight",LOAD("Stage_${s.id}_MaxBlockheight")-anticipateBlocks)`);

            contract.stages
                .filter((subStage) => subStage.offsetTo === s.id)
                .forEach((subStage) => {
                    method.addLine(`updateStage${subStage.id}(anticipateBlocks)`);
                });

            method.addLine(`RETURN 0`);
        });

    method = builder.addMethod('AddImageBaseInfo', true, [
        { name: 'thumb', type: 'String' },
        { name: 'pieces', type: 'Uint64' },
        { name: 'description', type: 'String' },
    ]);
    method.addLine(`IF LOAD("Owner")==SIGNER() && LOAD("PartyA_Deposited")==0 && LOAD("PartyB_Deposited")==0 THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`DIM id as String`);
    method.addLine(`LET id=HEX(TXID())`);
    method.addLine(`STORE("IMAGE"+id+"_PIECES",pieces)`);
    method.addLine(`STORE("IMAGE"+id+"_DESCRIPTION",description)`);
    method.addLine(`STORE("IMAGE"+id+"_THUMB",thumb)`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('AddImageMain', true, [
        { name: 'id', type: 'String' },
        { name: 'piece', type: 'Uint64' },
        { name: 'data', type: 'String' },
    ]);
    method.addLine(`IF LOAD("Owner")==SIGNER() && LOAD("PartyA_Deposited")==0 && LOAD("PartyB_Deposited")==0 THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`STORE("IMAGE"+id+"_"+piece,data)`);
    method.addLine(`RETURN 0`);

    method = builder.addMethod('RemoveImage', true, [{ name: 'id', type: 'String' }]);
    method.addLine(`IF LOAD("Owner")==SIGNER() && LOAD("PartyA_Deposited")==0 && LOAD("PartyB_Deposited")==0 THEN GOTO ${method.jumpLine()}`);
    method.addLine(`RETURN 1`);
    method.addLine(`DIM pieces,currentPiece as Uint64`);
    method.addLine(`LET pieces=LOAD("IMAGE"+id+"_PIECES")`);
    method.addLine(`DELETE("IMAGE"+id+"_PIECES")`);
    method.addLine(`DELETE("IMAGE"+id+"_THUMB")`);
    method.addLine(`DELETE("IMAGE"+id+"_DESCRIPTION")`);
    method.addLine(`LET currentPiece=1`);
    method.addLine(`DELETE("IMAGE"+id+"_"+currentPiece)`);
    method.addLine(`LET currentPiece=currentPiece+1`);
    method.addLine(`IF currentPiece<=pieces THEN GOTO ${method.lastLineNumber - 1}`);
    method.addLine(`RETURN 0`);

    return builder.build();
};

const createDescriptionContract = (contract: IGuaranteeContract) => {
    return JSON.stringify(
        contract,
        replacerWithPath(function (field, value, path) {
            // console.log(path, '=', value);
            if (path === 'code' || path === 'compareCode' || path === 'scid' || path === 'firstPartyWallet.id' || path === 'secondPartyWallet.id') return undefined;
            if (field === 'color' || field === 'isHovered' || field === 'renderId' || field === 'images') return undefined;
            return value;
        })
    );
};

export const createStats = (contract?: IGuaranteeContract, currentBlockheight: Uint64 = 0) => {
    let a_RequiredDeposit: Uint64 = 0;
    let a_TotalGuarantee: Uint64 = 0;
    let a_TotalTransfer: Uint64 = 0;
    let a_TotalLoss: Uint64 = 0;
    let a_TotalPendingGuarantee: Uint64 = 0;
    let a_TotalPendingTransfer: Uint64 = 0;

    let b_RequiredDeposit: Uint64 = 0;
    let b_TotalGuarantee: Uint64 = 0;
    let b_TotalTransfer: Uint64 = 0;
    let b_TotalLoss: Uint64 = 0;
    let b_TotalPendingGuarantee: Uint64 = 0;
    let b_TotalPendingTransfer: Uint64 = 0;

    if (contract) {
        a_TotalGuarantee = contract.stages.reduce((acc, s) => acc + s.a_Guarantee, 0);
        a_TotalTransfer = contract.stages.reduce((acc, s) => acc + s.a_Transfer, 0);
        a_RequiredDeposit = a_TotalGuarantee + a_TotalTransfer;
        b_TotalGuarantee = contract.stages.reduce((acc, s) => acc + s.b_Guarantee, 0);
        b_TotalTransfer = contract.stages.reduce((acc, s) => acc + s.b_Transfer, 0);
        b_RequiredDeposit = b_TotalGuarantee + b_TotalTransfer;

        a_TotalPendingGuarantee = contract.stages.filter((s) => !isStageClosed(s, currentBlockheight)).reduce((acc, s) => acc + s.a_Guarantee, 0);
        a_TotalPendingTransfer = contract.stages.filter((s) => !isStageClosed(s, currentBlockheight)).reduce((acc, s) => acc + s.b_Transfer, 0);
        b_TotalPendingGuarantee = contract.stages.filter((s) => !isStageClosed(s, currentBlockheight)).reduce((acc, s) => acc + s.b_Guarantee, 0);
        b_TotalPendingTransfer = contract.stages.filter((s) => !isStageClosed(s, currentBlockheight)).reduce((acc, s) => acc + s.a_Transfer, 0);

        a_TotalLoss = contract.stages.filter((s) => hasStageEndedWithoutAgreement(s, currentBlockheight)).reduce((acc, s) => acc + s.b_Transfer + s.a_Guarantee, 0);
        b_TotalLoss = contract.stages.filter((s) => hasStageEndedWithoutAgreement(s, currentBlockheight)).reduce((acc, s) => acc + s.a_Transfer + s.b_Guarantee, 0);
    }

    const stats = {
        calculatedAtBlockheight: currentBlockheight,
        a_RequiredDeposit,
        a_TotalGuarantee,
        a_TotalTransfer,
        a_TotalLoss,
        a_TotalPendingGuarantee,
        a_TotalPendingTransfer,
        b_RequiredDeposit,
        b_TotalGuarantee,
        b_TotalTransfer,
        b_TotalLoss,
        b_TotalPendingGuarantee,
        b_TotalPendingTransfer,
    } as IGuaranteeStats;

    return stats;
};

export const isStageClosed = (s: IStage, currentBlockheight: Uint64): boolean => {
    if (s.a_Approved && s.b_Approved) return true;

    if (s.loadedFinishedBlockheight && s.loadedFinishedBlockheight > 0) {
        return true;
    }

    if (s.loadedMaxBlockheight && s.loadedMaxBlockheight < currentBlockheight) {
        return true;
    }

    return false;
};

export const hasStageEndedWithoutAgreement = (s: IStage, currentBlockheight: Uint64): boolean => {
    return s.loadedFinishedBlockheight == null && s.loadedMaxBlockheight != null && s.loadedMaxBlockheight >= currentBlockheight;
};

export const loadContract = async (scid: string): Promise<ILoadContractResult> => {
    try {
        console.log('Trying to load', scid);
        const result = await getDeroInterface().getSmartContract({ scid, code: true, variables: true });

        const regex = /\/\/ GuaranteeContract - USE AT YOUR OWN RISK: (.*)/m;
        const match = getSmartContractCode(result).match(regex);
        const jsonString = match ? match[1].trim() : null;

        if (!jsonString) {
            throw new GuaranteeContractLoadError();
        }
        const parsedContract = JSON.parse(jsonString) as IGuaranteeContract;
        parsedContract.scid = scid;
        parsedContract.code = result.code;
        parsedContract.compareCode = createSmartContractCode(parsedContract);

        if (parsedContract.firstPartyWallet) {
            parsedContract.firstPartyWallet.id = nanoid();
        }

        if (parsedContract.secondPartyWallet) {
            parsedContract.secondPartyWallet.id = nanoid();
        }

        if (result.stringkeys) {
            parsedContract.firstPartyAmountFunded = (result.stringkeys[`PartyA_Deposited`] as Uint64) > 0;
            parsedContract.secondPartyAmountFunded = (result.stringkeys[`PartyB_Deposited`] as Uint64) > 0;
            parsedContract.ownerAddress = result.stringkeys[`OwnerAddress`] as string;

            parsedContract.stages = parsedContract.stages
                .sort((a, b) => a.id - b.id)
                .map((s, index, array) => {
                    const stage = s as any;
                    stage.color = getColor(index, array.length);
                    ['A', 'B'].forEach((party) => {
                        stage[`${party.toLowerCase()}_Approved`] = result.stringkeys![`Stage_${stage.id}_${party}_Approved`] === 1;
                    });
                    stage['loadedFinishedBlockheight'] = result.stringkeys![`Stage_${stage.id}_FinishedBlockheight`];
                    stage['loadedMaxBlockheight'] = result.stringkeys![`Stage_${stage.id}_MaxBlockheight`];
                    stage['renderId'] = nanoid();

                    return stage as IStage;
                });

            parsedContract.images = parseImages(result.stringkeys);

            parsedContract.state = result.stringkeys.State as 'PENDING_DEPOSITS' | 'STARTED' | 'ENDED';
        } else {
            throw new GuaranteeContractLoadError();
        }

        return { contract: parsedContract, balances: result.balances! };
    } catch (e) {
        console.error(e);
        throw new ContractLoadError();
    }
};

const parseImages = (stringkeys: { [key: string]: string | number }) => {
    const images: { [key: string]: IGuaranteeImage } = {};

    for (const key in stringkeys) {
        if (!key.startsWith('IMAGE')) {
            continue;
        }
        const keyParts = key.substring(5).split('_');
        if (keyParts[1] !== 'THUMB') {
            continue;
        }

        const id = keyParts[0];
        const thumb = stringkeys[key] as string;
        const description = stringkeys[`IMAGE${id}_DESCRIPTION`] as string;
        const pieces = stringkeys[`IMAGE${id}_PIECES`] as number;

        const pieceArray: string[] = [];

        for (let index = 1; index <= pieces; index++) {
            const newPiece = stringkeys[`IMAGE${id}_${index}`] as string;
            pieceArray.push(newPiece);
        }

        const fullImage = pieceArray.join('');

        images[id] = { id, thumb, description, fullImage };
    }

    return images;
};

export const loadContractAndSet = async (scid: string, validation: boolean = true) => {
    try {
        const { contract, balances } = await loadContract(scid);

        if (validation && (contract.code !== contract.compareCode || SHOW_COMPARISON_ALWAYS || isShowContractVerificationAlways())) {
            setCompareLoadContractResult({ contract, balances });
        } else {
            setVerifiedGuaranteeContractAndBalances({ contract, balances });
            LocalStorage.setLastOpenedGuaranteeContract(contract.scid!);
            if (validation) {
                addSnackbar({ message: `The contract was loaded successfully.`, severity: MESSAGE_SEVERITY.SUCCESS });
            }
        }
    } catch (e) {
        addSnackbar({ message: `Error loading the contract.`, severity: MESSAGE_SEVERITY.ERROR });
    }
};

export const setVerifiedGuaranteeContractAndBalances = ({ contract, balances }: ILoadContractResult) => {
    setContract(contract as IGuaranteeContract);
    setGuaranteeSmartContractBalances(balances);
    updateSmartContracts();
};

export const isStageApproved = (stage: IStage) => {
    if (stage && stage.a_Approved && stage.b_Approved) return true;
    return false;
};

export const isStageExpired = (stage: IStage, currentBlockheight: Uint64) => {
    if (stage.loadedMaxBlockheight) {
        return stage.loadedMaxBlockheight < currentBlockheight;
    }

    return false;
};

export const isFundedByParty = (party: 'A' | 'B' | null, contract: IGuaranteeContract) => {
    if (party === 'A' && contract.firstPartyAmountFunded) return true;
    if (party === 'B' && contract.secondPartyAmountFunded) return true;
    return false;
};

export const isStageApprovedByParty = (party: 'A' | 'B' | null, stage: IStage) => {
    if (party === 'A' && stage.a_Approved) return true;
    if (party === 'B' && stage.b_Approved) return true;
    return false;
};

export const approveStage = async (scid: Hash, stage: IStage) => {
    const txid = await scInvoke({
        scid,
        sc_rpc: [
            { name: 'entrypoint', datatype: 'S', value: 'Approve' },
            { name: 'stage', datatype: 'U', value: stage.id },
        ],
        waitFor: true,
    });
    return txid;
};

export const resetVoteStage = async (scid: Hash, stage: IStage) => {
    const txid = await scInvoke({
        scid,
        sc_rpc: [
            { name: 'entrypoint', datatype: 'S', value: 'ResetVote' },
            { name: 'stage', datatype: 'U', value: stage.id },
        ],
        waitFor: true,
    });
    return txid;
};

interface IGuaranteeExpiryInfo {
    description?: string;
    type: 'dynamic' | 'fixed' | 'noexpiry';
    approved: boolean;
    remaining?: Uint64;
    fixedBlockheight?: Uint64;
    fixedBlockDate?: Dayjs;
    expired?: boolean;
}

export const calcExpiryInfo = (contract: IGuaranteeContract, stage: IStage, currentBlockheightOrEstimate: CurrentBlockheightOrEstimate): IGuaranteeExpiryInfo => {
    let expiryInfo: IGuaranteeExpiryInfo | undefined = undefined;

    if (stage.offsetTo) {
        if (stage.offsetTo > 0) {
            expiryInfo = getExpiryInfo_AfterStageFinishes(contract, stage, currentBlockheightOrEstimate);
        } else if (stage.offsetTo === -1) {
            expiryInfo = getExpiryInfo_AfterContractStarted(contract, stage, currentBlockheightOrEstimate);
        } else if (stage.offsetTo === -2) {
            expiryInfo = getExpiryInfo_AfterContractInstalled(contract, stage, currentBlockheightOrEstimate);
        } else {
            throw new Error();
        }
    } else if (stage.blocks) {
        expiryInfo = getExpiryInfo_MaxBlockheight(contract, stage, currentBlockheightOrEstimate);
    } else {
        expiryInfo = { type: 'noexpiry', approved: isStageApproved(stage) };
    }

    return expiryInfo!;
};

export const getExpiryInfo_AfterContractInstalled = (contract: IGuaranteeContract, stage: IStage, currentBlockheight: CurrentBlockheightOrEstimate): IGuaranteeExpiryInfo => {
    let description = 'After Contract installed';
    let type: 'noexpiry' | 'dynamic' | 'fixed' = 'dynamic';
    let remaining = stage.blocks;
    let fixedBlockheight: Uint64 | undefined;
    let fixedBlockDate = undefined;
    let expired = false;
    let approved = isStageApproved(stage);

    if (!approved) {
        if (contract.state === 'PENDING_DEPOSITS' || contract.state === 'STARTED') {
            type = 'fixed';
            fixedBlockheight = stage.loadedMaxBlockheight!;
            fixedBlockDate = calculateEstimatedDate(fixedBlockheight, currentBlockheight.blockheight);
            expired = isStageExpired(stage, currentBlockheight.blockheight);
            if (expired) {
                remaining = 0;
            } else {
                remaining = fixedBlockheight - currentBlockheight.blockheight;
            }
        }
    }

    return { description, type, approved, remaining, fixedBlockheight, fixedBlockDate, expired };
};

export const getExpiryInfo_AfterContractStarted = (contract: IGuaranteeContract, stage: IStage, currentBlockheight: CurrentBlockheightOrEstimate): IGuaranteeExpiryInfo => {
    let description = 'After Contract started';
    let type: 'noexpiry' | 'dynamic' | 'fixed' = 'dynamic';
    let remaining = stage.blocks;
    let fixedBlockheight: Uint64 | undefined;
    let fixedBlockDate = undefined;
    let expired = false;
    let approved = isStageApproved(stage);

    if (!approved) {
        if (contract.state === 'STARTED') {
            type = 'fixed';
            fixedBlockheight = stage.loadedMaxBlockheight!;
            fixedBlockDate = calculateEstimatedDate(fixedBlockheight, currentBlockheight.blockheight);
            expired = isStageExpired(stage, currentBlockheight.blockheight);
            if (expired) {
                remaining = 0;
            } else {
                remaining = fixedBlockheight - currentBlockheight.blockheight;
            }
        }
    }

    return { description, type, approved, remaining, fixedBlockheight, fixedBlockDate, expired };
};

export const getExpiryInfo_AfterStageFinishes = (contract: IGuaranteeContract, stage: IStage, currentBlockheight: CurrentBlockheightOrEstimate): IGuaranteeExpiryInfo => {
    let description = `After Stage ${stage.offsetTo} finishes`;
    let type: 'noexpiry' | 'dynamic' | 'fixed' = 'dynamic';
    let remaining = stage.blocks;
    let fixedBlockheight: Uint64 | undefined;
    let fixedBlockDate = undefined;
    let expired = false;
    let approved = isStageApproved(stage);

    if (!approved) {
        const parent = contract.stages.find((s) => s.id === stage.offsetTo)!;

        if (contract.state === 'PENDING_DEPOSITS' || contract.state === 'STARTED') {
            if (parent.loadedFinishedBlockheight) {
                type = 'fixed';
                expired = isStageExpired(stage, currentBlockheight.blockheight);
                fixedBlockheight = stage.loadedMaxBlockheight!;
                fixedBlockDate = calculateEstimatedDate(fixedBlockheight, currentBlockheight.blockheight);
                if (expired) {
                    remaining = 0;
                } else {
                    remaining = fixedBlockheight - currentBlockheight.blockheight;
                }
            }
        }
    }

    return { description, type, approved, remaining, fixedBlockheight, fixedBlockDate, expired };
};

export const getExpiryInfo_MaxBlockheight = (contract: IGuaranteeContract, stage: IStage, currentBlockheight: CurrentBlockheightOrEstimate): IGuaranteeExpiryInfo => {
    let description = 'Max. Blockheight';
    let type: 'noexpiry' | 'dynamic' | 'fixed' = 'fixed';
    let expired = currentBlockheight.blockheight >= stage.blocks;
    let remaining = expired ? 0 : stage.blocks - currentBlockheight.blockheight!;
    let fixedBlockheight = stage.blocks;
    let fixedBlockDate = calculateEstimatedDate(fixedBlockheight, currentBlockheight.blockheight);
    let approved = isStageApproved(stage);

    return { description, type, approved, remaining, fixedBlockheight, fixedBlockDate, expired };
};

export const reassignColors = (contract: IGuaranteeContract) => {
    //use only from within redux
    contract.stages.forEach((stage, index, array) => {
        const color = getColor(index, array.length);
        stage.color = color;
    });
};

export const getStageDraggableSpanId = (stage: IStage) => `stageSpan_${stage.id}_${stage.renderId}`;

export const getStageDraggableApproveButtonId = (stage: IStage) => `stageApproveButton_${stage.id}_${stage.renderId}`;

const NET_PAYLOAD = 8000;

function splitBase64IntoChunks(base64: string): string[] {
    const chunks: string[] = [];
    let index = 0;

    while (index < base64.length) {
        let end = Math.min(index + NET_PAYLOAD, base64.length);
        chunks.push(base64.slice(index, end));
        index += NET_PAYLOAD;
    }

    return chunks;
}

export const getEstimatedAddImageCost = async (scid: string, base64: string, base64Thumb: string, description: string, signer: string) => {
    let total = 0;
    let pieces = splitBase64IntoChunks(base64);

    let sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'thumb', datatype: 'S', value: base64Thumb });
    sc_rpc.push({ name: 'pieces', datatype: 'U', value: pieces.length });
    sc_rpc.push({ name: 'description', datatype: 'S', value: description });

    const { gasstorage: gasThumb } = await getGasEstimate({ scid, entrypoint: 'AddImageBaseInfo', sc_rpc, signer });

    total += gasThumb;

    for (let index = 0; index < pieces.length; index++) {
        const data = pieces[index];

        sc_rpc = new Array<IRpc_Arguments>();

        sc_rpc.push({ name: 'id', datatype: 'S', value: '52150d8d66589eb4a318adc009388fce5403404bd3e98b0b07622c9f13c23c2b' });
        sc_rpc.push({ name: 'piece', datatype: 'U', value: index + 1 });
        sc_rpc.push({ name: 'data', datatype: 'S', value: data });

        const { gasstorage: gasMainPiece } = await getGasEstimate({ scid, entrypoint: 'AddImageMain', sc_rpc, signer });

        total += gasMainPiece;
    }

    return total;
};

export const addImage = async (scid: string, base64: string, base64Thumb: string, description: string, signer: string) => {
    let pieces = splitBase64IntoChunks(base64);

    let sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'thumb', datatype: 'S', value: base64Thumb });
    sc_rpc.push({ name: 'pieces', datatype: 'U', value: pieces.length });
    sc_rpc.push({ name: 'description', datatype: 'S', value: description });

    const txid = await scInvokeWithGasEstimate({ scid, entrypoint: 'AddImageBaseInfo', sc_rpc, signer, waitFor: true });

    for (let index = 0; index < pieces.length; index++) {
        const data = pieces[index];

        sc_rpc = new Array<IRpc_Arguments>();

        sc_rpc.push({ name: 'id', datatype: 'S', value: txid });
        sc_rpc.push({ name: 'piece', datatype: 'U', value: index + 1 });
        sc_rpc.push({ name: 'data', datatype: 'S', value: data });

        const partialtxid = await scInvokeWithGasEstimate({ scid, entrypoint: 'AddImageMain', sc_rpc, signer, waitFor: true });
    }
};

export const removeImage = async (scid: string, id: string) => {
    let sc_rpc = new Array<IRpc_Arguments>();

    sc_rpc.push({ name: 'id', datatype: 'S', value: id });

    const txid = await scInvoke({ scid, entrypoint: 'RemoveImage', sc_rpc, waitFor: true });

    return txid;
};
