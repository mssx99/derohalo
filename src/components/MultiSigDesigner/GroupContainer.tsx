import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import ApproverContainer from './ApproverContainer';
import { StrictModeDroppable } from 'components/common/StrictModeDroppable';
import { styled } from '@mui/material/styles';
import { useArrowContext } from 'contexts/MultiSigArrowContext';
import { deleteAuthGroup, useContract, useReorder } from 'hooks/multiSigHooks';
import { useConditionDialog } from './dialogs/ConditionsDialog';
import ConditionContainer from './ConditionContainer';
import IconButton from '@mui/material/IconButton';
import RemoveIcon from '@mui/icons-material/Remove';

interface IGroupContainerProps {
    value: IAuthorizationGroup;
    index: number;
    isDropDisabled: boolean;
}

const Container = styled('div')({
    position: 'relative',
    backgroundColor: '#d0cdcd70',
    minWidth: 200,
    margin: 10,
    padding: 5,
    borderRadius: 5,
    '&:hover .fadeiconbutton': {
        opacity: 1,
    },
});

const Items = styled('div')({
    marginTop: 10,
    color: 'white',
});

const FadeIconButton = styled(IconButton)({
    position: 'absolute',
    right: -5,
    top: -10,
    zIndex: 1,
    opacity: 0,
    transition: 'opacity 0.2s',
});

const GroupContainer: React.FC<IGroupContainerProps> = ({ value, index, isDropDisabled }: IGroupContainerProps) => {
    const { isLoaded } = useContract();
    const { isOpen, setOpen, setAuthorizationGroup: setAuthorizationGroupInDialog } = useConditionDialog();
    const id = value.id;

    const { showArrows, setShowArrows, updateArrows } = useArrowContext();
    const { reorder } = useReorder();
    const draggableRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let arrowUpdateInterval: number;
        const handleTransitionStart = (e: TransitionEvent) => {
            if (e.propertyName === 'height') {
                arrowUpdateInterval = window.setInterval(updateArrows, 15);
            }
        };

        const handleTransitionEnd = (e: TransitionEvent) => {
            if (e.propertyName === 'height') {
                if (arrowUpdateInterval) {
                    window.clearInterval(arrowUpdateInterval);
                    arrowUpdateInterval = 0;
                }
            }
        };

        const element = draggableRef.current;
        if (element) {
            element.addEventListener('transitionstart', handleTransitionStart);
            element.addEventListener('transitionend', handleTransitionEnd);
        }

        return () => {
            if (element) {
                element.removeEventListener('transitionstart', handleTransitionStart);
                element.removeEventListener('transitionend', handleTransitionEnd);
                if (arrowUpdateInterval) {
                    window.clearInterval(arrowUpdateInterval);
                    arrowUpdateInterval = 0;
                }
            }
        };
    }, [draggableRef.current]);

    const openDialog = useCallback(() => {
        setAuthorizationGroupInDialog(value);
    }, [value]);

    const removeAuthGroup = useCallback(() => {
        deleteAuthGroup(value.id);
        if (showArrows) {
            setShowArrows(false);
            setTimeout(() => {
                setShowArrows(true);
            }, 15);
        }
    }, [value, showArrows]);

    return (
        <Draggable draggableId={id} index={index} isDragDisabled={isLoaded || !reorder}>
            {(provided) => (
                <div
                    ref={(el) => {
                        provided.innerRef(el);
                        draggableRef.current = el;
                    }}
                    {...provided.dragHandleProps}
                    {...provided.draggableProps}
                >
                    <Container>
                        {!isLoaded && (
                            <FadeIconButton aria-label="more" id="long-button" onClick={removeAuthGroup} className="fadeiconbutton">
                                <RemoveIcon />
                            </FadeIconButton>
                        )}

                        <ConditionContainer authorizationGroup={value} onOpen={openDialog} />
                        <StrictModeDroppable droppableId={`authDroppable_${id}`} type="GROUP_CONTAINER" isDropDisabled={isDropDisabled}>
                            {(provided, snapshot) => (
                                <Items ref={provided.innerRef} {...provided.droppableProps}>
                                    {value?.approvers.map((approver, index) => (
                                        <ApproverContainer key={`approver_${approver.id}`} value={approver} index={index} />
                                    ))}
                                    {provided.placeholder}
                                </Items>
                            )}
                        </StrictModeDroppable>
                    </Container>
                </div>
            )}
        </Draggable>
    );
};

export default GroupContainer;
