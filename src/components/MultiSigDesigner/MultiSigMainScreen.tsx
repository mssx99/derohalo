import React, { useEffect, useRef, useCallback } from 'react';
import GroupContainer from './GroupContainer';

import { DragDropContext, DragStart, DragUpdate, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from 'components/common/StrictModeDroppable';
import { styled } from '@mui/material/styles';
import {
    updateAuthorizationGroups,
    updateAuthorizationGroupApprovers,
    addApproverToAuthgroup,
    moveApproverToAuthgroup,
    useContract,
    useReorder,
    usePreview,
    setMaxTransactionsInAtomic,
} from 'hooks/multiSigHooks';
import { useDragStart } from 'hooks/multiSigHooks';
import InvolvedParties from './InvolvedParties';
import { createApprover, createAuthorizationGroup, createNewMultiSigContract } from 'helpers/ContractHelper';
import { useArrowContext } from 'contexts/MultiSigArrowContext';
import Toolbar from './Toolbar';
import { HeaderTitle, SubTitle } from 'components/common/TextElements';
import Fieldset from 'components/common/Fieldset';
import InvolvedPartiesTitle from './InvolvedPartiesTitle';
import AuthGroupsTitle from './AuthGroupsTitle';
import AGOptions from './AGOptions';

import CodeDisplay from 'components/common/CodeDisplay';
import Transactions from './Transactions';

import Slider from '@mui/material/Slider';
import { useHorizontalWheelScroll } from 'hooks/mainHooks';

const Container = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
});

interface AuthGroupsContainerProps {
    reorder: boolean;
}

const AuthGroupsContainer = styled('div', { shouldForwardProp: (prop) => prop !== 'reorder' })<AuthGroupsContainerProps>(({ reorder }) => ({
    display: 'inline-flex',
    flexWrap: reorder ? undefined : 'wrap',
    justifyContent: 'space-between',
    overflow: 'auto',
    minHeight: 375,
}));

const reorderList = (list: any[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

const MultiSigMainScreen: React.FC = () => {
    const { contract, isLoaded } = useContract();
    const { dragStart, setDragStart } = useDragStart();
    const { updateArrows } = useArrowContext();
    const { reorder } = useReorder();
    const { preview, setPreview } = usePreview();

    const [showArrows, setShowArrows] = React.useState<boolean>(true);

    const handleMouseMoveRef = useRef<(() => void) | null>(null);
    const runningHandleMouseMoveRef = useRef<(() => void) | null>(null);
    const authGroupsContainerRef = useHorizontalWheelScroll({ disabled: !reorder });

    handleMouseMoveRef.current = useCallback(() => {
        updateArrows();
    }, [updateArrows]);

    const startMouseObserver = useCallback(() => {
        if (handleMouseMoveRef.current) {
            const screen = document.getElementById('MainScreenMultiSignature');
            if (screen) {
                screen.addEventListener('mousemove', handleMouseMoveRef.current);
                runningHandleMouseMoveRef.current = handleMouseMoveRef.current;
            } else {
                console.error('Could not add EventListener for MultiSig');
            }
        }
    }, []);

    const stopMouseObserver = useCallback(() => {
        if (runningHandleMouseMoveRef.current) {
            const screen = document.getElementById('MainScreenMultiSignature');
            if (screen) {
                screen.removeEventListener('mousemove', runningHandleMouseMoveRef.current);
                runningHandleMouseMoveRef.current = null;
            } else {
                console.error('Could not add EventListener for MultiSig');
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            stopMouseObserver();
        };
    }, []);

    const onDragStart = useCallback(
        (ds: DragStart) => {
            setDragStart(ds);
            if (showArrows) startMouseObserver();
        },
        [showArrows]
    );

    const onDragEnd = useCallback(
        (result: DropResult) => {
            console.log('dragEnd', result);
            setDragStart(null);
            stopMouseObserver();
            updateArrows();
            if (!result.destination) {
                return;
            }

            const source = result.source;
            const destination = result.destination;
            if (source.droppableId === destination.droppableId && source.index === destination.index) {
                return;
            }
            if (result.type === 'COLUMN') {
                const reordered = reorderList(contract.authorizationGroups, source.index, destination.index);
                updateAuthorizationGroups(reordered);
                return;
            }

            if (result.source.droppableId === 'INVOLVED_PARTIES') {
                const wallet: IWallet = contract.involvedParties[result.source.index];
                const newApprover: IApprover = createApprover(wallet);
                let destinationGroup = contract.authorizationGroups.find((ag) => destination.droppableId === `authDroppable_${ag.id}`);
                if (destinationGroup) addApproverToAuthgroup(newApprover, destinationGroup, result.destination.index);
                return;
            }

            let sourceGroup = contract.authorizationGroups.find((ag) => source.droppableId === `authDroppable_${ag.id}`);
            let destinationGroup = contract.authorizationGroups.find((ag) => destination.droppableId === `authDroppable_${ag.id}`);

            if (sourceGroup && result.destination.droppableId === 'authDroppable_new') {
                moveApproverToAuthgroup(sourceGroup, null, source.index, 0);
                return;
            }

            if (!sourceGroup || !destinationGroup) return;

            if (sourceGroup === destinationGroup) {
                const reordered = reorderList(sourceGroup.approvers, source.index, destination.index);
                updateAuthorizationGroupApprovers(sourceGroup.id, reordered);
                return;
            }

            moveApproverToAuthgroup(sourceGroup, destinationGroup, source.index, destination.index);
        },
        [contract]
    );

    const isDropDisabled = (authorizationGroup: IAuthorizationGroup): boolean => {
        if (dragStart == null) return false;
        if (dragStart.source.droppableId === 'INVOLVED_PARTIES') {
            const currentWallet: IWallet = contract.involvedParties[dragStart.source.index];
            return authorizationGroup.approvers.some((approver) => approver.wallet.id === currentWallet.id);
        }
        const currentAuthGroup: IAuthorizationGroup | undefined = contract.authorizationGroups.find((ag) => dragStart.source.droppableId === `authDroppable_${ag.id}`);
        if (currentAuthGroup && currentAuthGroup.id !== authorizationGroup.id) {
            const currentWallet: IWallet = currentAuthGroup.approvers[dragStart.source.index].wallet;
            return authorizationGroup.approvers.some((approver) => approver.wallet.id === currentWallet.id);
        } else if (currentAuthGroup && currentAuthGroup.id === authorizationGroup.id) {
            return false;
        }
        return true;
    };

    return (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <Container id="MainScreenMultiSignature">
                <HeaderTitle>Create your MultiSignature Contract</HeaderTitle>

                <div className="previewContainer">
                    <div className="configurator">
                        <Toolbar />

                        {isLoaded ? (
                            <Fieldset title="Transactions">
                                <Transactions />
                            </Fieldset>
                        ) : (
                            <Fieldset title={<InvolvedPartiesTitle />}>
                                <InvolvedParties />
                            </Fieldset>
                        )}

                        <Fieldset title={<AuthGroupsTitle />}>
                            <AGOptions />
                            <StrictModeDroppable droppableId="ROOT" type="COLUMN" direction="horizontal">
                                {(provided) => (
                                    <AuthGroupsContainer
                                        ref={(el) => {
                                            provided.innerRef(el);
                                            authGroupsContainerRef(el);
                                        }}
                                        {...provided.droppableProps}
                                        className="preventSelect importantScrollbar"
                                        reorder={reorder}
                                    >
                                        {contract.authorizationGroups.map((group, index) => (
                                            <GroupContainer key={`authorizationGroup_${group.id}`} value={group} index={index} isDropDisabled={isDropDisabled(group)} />
                                        ))}
                                        {provided.placeholder}
                                    </AuthGroupsContainer>
                                )}
                            </StrictModeDroppable>
                        </Fieldset>
                    </div>
                    <CodeDisplayWithOptions show={preview} code={contract.code} />
                </div>
            </Container>
        </DragDropContext>
    );
};

interface ICodeDisplayWithOptions {
    show: boolean;
    code?: string;
}

const CodeDisplayWithOptions: React.FC<ICodeDisplayWithOptions> = ({ show, code }) => {
    const { isLoaded, contract } = useContract();

    const handleChange = (event: Event, newValue: number | number[]) => {
        setMaxTransactionsInAtomic(newValue as number);
    };

    return (
        <CodeDisplay className="contract" show={show} title="Generated SmartContract Code" code={code}>
            {!isLoaded && (
                <Slider
                    min={1}
                    value={contract.maxTransactionsInAtomic}
                    aria-label="Maximum transactions sent in one atomic transaction"
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value: number) => `${value} transactions max per proposal`}
                    onChange={handleChange}
                />
            )}
        </CodeDisplay>
    );
};

export default MultiSigMainScreen;
