import React, { useRef, useCallback, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { useArrowContext } from 'contexts/GuaranteeArrowContext';
import { DragDropContext, DragStart, DragUpdate, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from 'components/common/StrictModeDroppable';
import { setStages, useContract } from 'hooks/guaranteeHooks';
import StageContainer from './StageContainer';
import { useHorizontalWheelScroll } from 'hooks/mainHooks';

const StageGlobalContainer = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    minHeight: 355,
});

const reorderStages = (stages: IStage[], fromPosition: number, toPosition: number): IStage[] => {
    let newStages: IStage[] = [...stages];

    const [stageToMove] = newStages.splice(fromPosition, 1);

    newStages.splice(toPosition, 0, stageToMove);

    let idToPositionMap: { [key: number]: number } = {};
    newStages.forEach((stage, index) => {
        idToPositionMap[stage.id] = index;
    });

    newStages = newStages.map((stage, index) => {
        const newId = index + 1;
        const newOffsetTo = stage.offsetTo && stage.offsetTo > 0 ? idToPositionMap[stage.offsetTo] + 1 : stage.offsetTo;

        return { ...stage, id: newId, offsetTo: newOffsetTo };
    });

    return newStages;
};

const StageConfig: React.FC = () => {
    const { contract } = useContract();
    const { showArrows, updateArrows } = useArrowContext();

    const handleMouseMoveRef = useRef<(() => void) | null>(null);
    const runningHandleMouseMoveRef = useRef<(() => void) | null>(null);

    handleMouseMoveRef.current = useCallback(() => {
        updateArrows();
    }, []);

    const startMouseObserver = useCallback(() => {
        if (handleMouseMoveRef.current) {
            const screen = document.getElementById('MainScreenGuarantee');
            if (screen) {
                screen.addEventListener('mousemove', handleMouseMoveRef.current);
                runningHandleMouseMoveRef.current = handleMouseMoveRef.current;
            } else {
                console.error('Could not add EventListener for Guarantees');
            }
        }
    }, []);

    const stopMouseObserver = useCallback(() => {
        if (runningHandleMouseMoveRef.current) {
            const screen = document.getElementById('MainScreenGuarantee');
            if (screen) {
                screen.removeEventListener('mousemove', runningHandleMouseMoveRef.current);
                runningHandleMouseMoveRef.current = null;
            } else {
                console.error('Could not add EventListener for Guarantees');
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            stopMouseObserver();
        };
    }, []);

    useEffect(() => {
        updateArrows();
    }, [contract.stages]);

    const onDragStart = useCallback(
        (ds: DragStart) => {
            if (showArrows) startMouseObserver();
        },
        [showArrows]
    );

    const onDragEnd = useCallback(
        (result: DropResult) => {
            stopMouseObserver();

            if (!result.destination) {
                return;
            }

            const source = result.source;
            const destination = result.destination;
            if (source.droppableId === destination.droppableId && source.index === destination.index) {
                return;
            }

            const reordered = reorderStages(contract.stages, source.index, destination.index);
            setStages(reordered);
        },
        [contract.stages]
    );

    return (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <StrictModeDroppable droppableId="ROOT" type="COLUMN" direction="horizontal">
                {(provided) => (
                    <StageGlobalContainer
                        ref={(el) => {
                            provided.innerRef(el);
                        }}
                        {...provided.droppableProps}
                        className="preventSelect"
                    >
                        {contract.stages.map((stage, index) => (
                            <StageContainer key={stage.renderId} index={index} stage={stage} />
                        ))}
                        {provided.placeholder}
                    </StageGlobalContainer>
                )}
            </StrictModeDroppable>
        </DragDropContext>
    );
};

export default StageConfig;
