import React, { useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Draggable } from 'react-beautiful-dnd';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import DeroAmount from 'components/common/DeroAmount';

import FaceIcon from '@mui/icons-material/Face';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

import Button from '@mui/material/Button';
import { deleteStage, useContract, useContractStats, useDisplayBlocks, usePartyLetter } from 'hooks/guaranteeHooks';
import { Small } from 'components/common/TextElements';
import { useStageDialog } from './dialogs/StageDialog';
import { useArrowContext } from 'contexts/GuaranteeArrowContext';

import IconButton from '@mui/material/IconButton';
import RemoveIcon from '@mui/icons-material/Remove';
import { convertBlocksToFormattedTime, convertBlocksToYearsMonthsDaysHours, formatNumber, formatTime } from 'helpers/FormatHelper';
import { useBlockheightDate, useCurrentBlockheight, useCurrentBlockheightOrEstimate } from 'hooks/deroHooks';
import {
    approveStage,
    calcExpiryInfo,
    getStageDraggableApproveButtonId,
    getStageDraggableSpanId,
    isFundedByParty,
    isStageApprovedByParty,
    loadContractAndSet,
    resetVoteStage,
} from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { ApprovedAvatar } from 'components/MultiSigDesigner/Transactions/dialogs/TransactionDialog/ViewTransactionDialog/ApprovalStatus';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY, SAVE_REMAINING_BLOCKS } from 'Constants';

interface IStageContainer {
    index: number;
    stage: IStage;
}

const Container = styled('div')`
    position: relative;
    background-color: #d0cdcd70;
    min-width: 300px;
    margin: 10px;
    padding: 5px;
    border-radius: 5px;
    &:hover .fadeiconbutton {
        opacity: 1;
    }
    display: flex;
    flex-direction: column;
`;

const FadeIconButton = styled(IconButton)({
    position: 'absolute',
    right: -5,
    top: -10,
    zIndex: 1,
    opacity: 0,
    transition: 'opacity 0.2s',
});

const StageContainer: React.FC<IStageContainer> = ({ stage, index }) => {
    const { isLoaded } = useContract();
    const { setRef, deleteRef, showArrows, setShowArrows, updateArrows } = useArrowContext();
    const draggableRef = useRef<HTMLDivElement | null>(null);

    const removeStage = useCallback(() => {
        deleteStage(stage.renderId!);
        if (showArrows) {
            setShowArrows(false);
            setTimeout(() => {
                setShowArrows(true);
            }, 15);
        }
    }, [stage, showArrows]);

    return (
        <Draggable draggableId={stage.renderId!} index={index} isDragDisabled={isLoaded}>
            {(provided, snapshot) => (
                <div
                    ref={(el) => {
                        provided.innerRef(el);
                        draggableRef.current = el;
                    }}
                    {...provided.dragHandleProps}
                    {...provided.draggableProps}
                    style={{
                        ...provided.draggableProps.style,
                        zIndex: snapshot.isDragging ? 100 : 'auto',
                    }}
                >
                    <Container>
                        {!isLoaded && (
                            <FadeIconButton aria-label="more" id="long-button" onClick={removeStage} className="fadeiconbutton">
                                <RemoveIcon />
                            </FadeIconButton>
                        )}

                        <StageContent stage={stage} />
                    </Container>
                </div>
            )}
        </Draggable>
    );
};

const StyledListItemText = styled(ListItemText)`
    && {
        min-height: 80px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        margin-top: 6px;
        margin-bottom: 6px;
    }
`;

const StyledSpan = styled('span')`
    display: block;
`;

const ConditionContainer = styled('div')`
    cursor: pointer;
`;

const WarningStyledSpan = styled(StyledSpan)(({ theme }) => ({
    color: theme.palette.warning.main,
}));

const ErrorStyledSpan = styled(StyledSpan)(({ theme }) => ({
    color: theme.palette.error.main,
}));

const DEFAULT_AVATAR_BACKGROUND_COLOR = '#757575';

const EXPIRY_AVATAR = (
    <Avatar>
        <HourglassEmptyIcon />
    </Avatar>
);

const EXPIRY_AVATAR_FINISHED = (
    <Avatar sx={{ bgcolor: 'green' }}>
        <CheckIcon />
    </Avatar>
);

const EXPIRY_AVATAR_EXPIRED = (
    <Avatar sx={{ bgcolor: '#fc5151' }}>
        <ClearIcon />
    </Avatar>
);

const StageContent: React.FC<{ stage: IStage }> = ({ stage }) => {
    const { isLoaded, contract } = useContract();
    const { displayBlocks } = useDisplayBlocks();
    const { setStage } = useStageDialog();
    const currentBlockheightOrEstimate = useCurrentBlockheightOrEstimate();

    const isStageApprovedByA = isStageApprovedByParty('A', stage);
    const isStageApprovedByB = isStageApprovedByParty('B', stage);

    const onOpen = useCallback(() => {
        setStage(stage);
    }, [stage]);

    const expiryInfo = useMemo(() => calcExpiryInfo(contract, stage, currentBlockheightOrEstimate), [contract, stage, currentBlockheightOrEstimate]);

    const expires = useMemo(() => {
        if (expiryInfo.approved) {
            return 'Finished';
        }
        if (expiryInfo.expired) {
            return 'Expired';
        }
        switch (expiryInfo.type) {
            case 'noexpiry':
                return 'No expiry';
            case 'dynamic':
                if (expiryInfo.description) return expiryInfo.description;
                break;
            case 'fixed':
                if (expiryInfo.description) return expiryInfo.description;
                break;
        }
    }, [expiryInfo]);

    const expiresDetail = useMemo(() => {
        if (expiryInfo.approved) {
            return undefined;
        }
        if (expiryInfo.expired) {
            return <ErrorStyledSpan>{formatTime(expiryInfo.fixedBlockDate!)}</ErrorStyledSpan>;
        }
        switch (expiryInfo.type) {
            case 'noexpiry':
                return undefined;
            case 'dynamic':
                return expiryInfo.remaining! < SAVE_REMAINING_BLOCKS ? (
                    <WarningStyledSpan>in {displayBlocks ? `${formatNumber(expiryInfo.remaining!)} blocks` : convertBlocksToYearsMonthsDaysHours(expiryInfo.remaining)}</WarningStyledSpan>
                ) : (
                    <StyledSpan>in {displayBlocks ? `${formatNumber(expiryInfo.remaining!)} blocks` : convertBlocksToYearsMonthsDaysHours(expiryInfo.remaining)}</StyledSpan>
                );
            case 'fixed':
                return expiryInfo.remaining! < SAVE_REMAINING_BLOCKS ? (
                    <>
                        <StyledSpan>{displayBlocks ? formatNumber(expiryInfo.fixedBlockheight!) : formatTime(expiryInfo.fixedBlockDate!)}</StyledSpan>
                        <WarningStyledSpan>in {displayBlocks ? `${formatNumber(expiryInfo.remaining!)} blocks` : convertBlocksToYearsMonthsDaysHours(expiryInfo.remaining)}</WarningStyledSpan>
                    </>
                ) : (
                    <>
                        <StyledSpan>{displayBlocks ? formatNumber(expiryInfo.fixedBlockheight!) : formatTime(expiryInfo.fixedBlockDate!)}</StyledSpan>
                        <StyledSpan>in {displayBlocks ? `${formatNumber(expiryInfo.remaining!)} blocks` : convertBlocksToYearsMonthsDaysHours(expiryInfo.remaining)}</StyledSpan>
                    </>
                );

                break;
        }
    }, [expiryInfo, displayBlocks]);

    let avatar = EXPIRY_AVATAR;

    if (expiryInfo.approved) {
        avatar = EXPIRY_AVATAR_FINISHED;
    } else if (expiryInfo.expired) {
        avatar = EXPIRY_AVATAR_EXPIRED;
    }

    const { setRef, deleteRef } = useArrowContext();
    const draggableSpanId = getStageDraggableSpanId(stage);
    const draggableSpanRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (draggableSpanId) {
            setRef(draggableSpanId, draggableSpanRef);

            return () => {
                deleteRef(draggableSpanId);
            };
        }
    }, [draggableSpanId]);

    return (
        <>
            <ConditionContainer onClick={onOpen}>
                <div ref={draggableSpanRef} style={{ display: 'inline' }}>
                    Stage {stage.id}
                </div>
                <List dense>
                    <ListItem>
                        <ListItemAvatar>{isStageApprovedByA ? <ApprovedAvatar>A</ApprovedAvatar> : <Avatar>A</Avatar>}</ListItemAvatar>
                        <ListItemText primary="Receives" secondary={<DeroAmount onlyText value={stage.a_Guarantee + stage.b_Transfer} />} />
                    </ListItem>
                    <ListItem>
                        <ListItemAvatar>{isStageApprovedByB ? <ApprovedAvatar>B</ApprovedAvatar> : <Avatar>B</Avatar>}</ListItemAvatar>
                        <ListItemText primary="Receives" secondary={<DeroAmount onlyText value={stage.b_Guarantee + stage.a_Transfer} />} />
                    </ListItem>
                    <ListItem>
                        <ListItemAvatar>{avatar}</ListItemAvatar>
                        <StyledListItemText primary={expires} secondary={expiresDetail} />
                    </ListItem>
                </List>
            </ConditionContainer>
            <ApproveButton stage={stage} />
            <StageDescription stage={stage} />
        </>
    );
};

const DescriptionContainer = styled('div')`
    text-align: center;
    padding: 5px;
    font-size: 0.725rem;
`;

const StageDescription: React.FC<{ stage: IStage }> = ({ stage }) => {
    if (!stage.description) return <></>;
    return (
        <DescriptionContainer>
            <Small>{stage.description}</Small>
        </DescriptionContainer>
    );
};

interface IApproveButton {
    stage: IStage;
}

const ABContainer = styled('div')`
    display: flex;
    flex-direction: row;
    & button {
        flex: 1;
    }
`;

const ApproveButton: React.FC<IApproveButton> = ({ stage }) => {
    const partyLetter = usePartyLetter();
    const { contract } = useContract();

    const isFunded = isFundedByParty(partyLetter, contract);

    const isStageApprovedByA = isStageApprovedByParty('A', stage);
    const isStageApprovedByB = isStageApprovedByParty('B', stage);

    const currentHasApproved = (partyLetter === 'A' && isStageApprovedByA) || (partyLetter === 'B' && isStageApprovedByB);
    const stageClosed = isStageApprovedByA && isStageApprovedByB;

    const handleApprove = useCallback(async () => {
        if (!contract?.scid) {
            addSnackbar({ message: `No loaded contract selected.`, severity: MESSAGE_SEVERITY.ERROR });
            return;
        }
        try {
            setBusyBackdrop(true, `Approving Stage ${stage.id}...`);
            await approveStage(contract.scid, stage);
            await loadContractAndSet(contract.scid, false);
            addSnackbar({ message: `Approved successfully.`, severity: MESSAGE_SEVERITY.SUCCESS });
        } catch (e) {
            addSnackbar({ message: `An error occurred. ${e}`, severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [contract?.scid, stage?.id]);

    const handleReject = useCallback(async () => {
        if (!contract?.scid) {
            addSnackbar({ message: `No loaded contract selected.`, severity: MESSAGE_SEVERITY.ERROR });
            return;
        }
        try {
            setBusyBackdrop(true, `Resetting vote for Stage ${stage.id}...`);
            await resetVoteStage(contract.scid, stage);
            await loadContractAndSet(contract.scid, false);
            addSnackbar({ message: `Resetted successfully.`, severity: MESSAGE_SEVERITY.SUCCESS });
        } catch (e) {
            addSnackbar({ message: `An error occurred. ${e}`, severity: MESSAGE_SEVERITY.ERROR });
        } finally {
            setBusyBackdrop(false);
        }
    }, [contract?.scid, stage?.id]);

    const { setRef, deleteRef, showArrows } = useArrowContext();
    const draggableApproveButtonId = getStageDraggableApproveButtonId(stage);
    const draggableApproveButtonRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (draggableApproveButtonId) {
            setRef(draggableApproveButtonId, draggableApproveButtonRef);

            return () => {
                deleteRef(draggableApproveButtonId);
            };
        }
    }, [draggableApproveButtonId]);

    return (
        <ABContainer ref={draggableApproveButtonRef}>
            {currentHasApproved ? (
                <Button onClick={handleReject} disabled={stageClosed} style={{ backgroundColor: showArrows ? stage.color : undefined }}>
                    Reject
                </Button>
            ) : (
                <Button onClick={handleApprove} disabled={contract.state !== 'STARTED' || stageClosed || !partyLetter} style={{ backgroundColor: showArrows ? stage.color : undefined }}>
                    Approve
                </Button>
            )}
        </ABContainer>
    );
};

export default StageContainer;
