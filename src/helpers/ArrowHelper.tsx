import React from 'react';
import { getApproverDraggableId, getInvolvedPartyDraggableId } from './MultiSig/MultiSigSmartContractHelper';
import { getStageDraggableApproveButtonId, getStageDraggableSpanId } from './Guarantee/GuaranteeSmartContractHelper';

export const getArrowStartEndMultiSig = (contract: IMultiSigContract, approver: IApprover, xRefs: Map<string, React.RefObject<HTMLDivElement>>): IArrowCoords | null => {
    if (!contract || !approver?.wallet || !xRefs) return null;

    const involvedParty = contract.involvedParties.find((wallet) => wallet.id === approver.wallet.id);

    if (!involvedParty) return null;

    const involvedPartyIndex = contract.involvedParties.findIndex((wallet) => wallet.id === approver.wallet.id);
    const color = involvedParty.color;

    const startDraggableId = getInvolvedPartyDraggableId(involvedParty);
    const cloneStartDraggableId = `clone_${startDraggableId}`;
    let clone: React.RefObject<HTMLDivElement> | undefined;
    if (xRefs.has(cloneStartDraggableId)) {
        clone = xRefs.get(cloneStartDraggableId);
    }
    const start = clone?.current ? xRefs.get(cloneStartDraggableId) : xRefs.get(startDraggableId);

    const endDraggableId = getApproverDraggableId(approver);
    const end = xRefs.get(endDraggableId);

    if (!start || !end) return null;
    return { start, end, color } as IArrowCoords;
};

export const getArrowStartEndGuarantee = (stage: IStage, dependantStage: IStage, xRefs: Map<string, React.RefObject<HTMLDivElement>>): IArrowCoords | null => {
    if (dependantStage.offsetTo && dependantStage.offsetTo > 0) {
        const startDraggableId = getStageDraggableApproveButtonId(stage);
        const endDraggableId = getStageDraggableSpanId(dependantStage);
        const start = xRefs.get(startDraggableId);
        const end = xRefs.get(endDraggableId);
        return { start, end, color: stage.color } as IArrowCoords;
    }
    return null;
};
