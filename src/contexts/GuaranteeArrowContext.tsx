import { styled } from '@mui/material/styles';
import React, { createContext, useContext, useReducer, useState, useRef, useEffect, useCallback, ReactElement } from 'react';
import Xarrow, { Xwrapper, useXarrow } from 'react-xarrows';
import { useContract, useShowArrows } from 'hooks/guaranteeHooks';
import { useForceUpdate, useHorizontalWheelScroll } from 'hooks/mainHooks';
import { getArrowStartEndGuarantee } from 'helpers/ArrowHelper';

interface IArrowProvider {
    children?: ReactElement | ReactElement[];
}

interface IArrowState {
    showArrows: boolean;
    setShowArrows: (on: boolean) => void;
    xRefs: Map<string, React.RefObject<HTMLDivElement>>;
    setRef: (id: string, ref: React.RefObject<HTMLDivElement>) => void;
    deleteRef: (id: string) => void;
    arrowCoords: IArrowCoords[];
    updateArrows: () => void;
}

const StageGlobalContainer_Holder = styled('div')`
    position: relative;
    display: flex;
    flex-direction: row;
    overflow: auto;
`;

const ArrowHolder = styled('div')`
    position: absolute;
    z-index: 101;
`;

const ArrowContext = createContext<IArrowState | undefined>(undefined);
const xRefs = new Map<string, React.RefObject<HTMLDivElement>>();

export const ArrowProvider: React.FC<IArrowProvider> = ({ children }) => {
    const [arrowCoords, setArrowCoords] = useState<IArrowCoords[]>(new Array<IArrowCoords>());
    const updateXarrow = useXarrow();
    const { contract } = useContract();
    const { showArrows, setShowArrows } = useShowArrows();
    const stageContainerRef = useHorizontalWheelScroll();

    const forceUpdate = useForceUpdate();
    const hasFunctionRunRef = useRef(false);

    const setRef = (id: string, ref: React.RefObject<HTMLDivElement>) => {
        xRefs.set(id, ref);
        handleForceUpdate();
    };

    const deleteRef = (id: string) => {
        xRefs.delete(id);
        handleForceUpdate();
    };

    const updateArrows = useCallback(() => {
        const arrowCoords = contract.stages.reduce((acc, stage) => {
            const dependantStages = contract.stages
                .filter((s) => s.offsetTo === stage.id)
                .forEach((dependantStage) => {
                    const coords = getArrowStartEndGuarantee(stage, dependantStage, xRefs);
                    if (coords) acc.push(coords);
                    if (!coords) console.log('prob:' + stage.id, dependantStage.id);
                });
            return acc;
        }, new Array<IArrowCoords>());

        setArrowCoords(arrowCoords);
    }, [contract]);

    useEffect(() => {
        if (!hasFunctionRunRef.current) {
            updateArrows();
            hasFunctionRunRef.current = true;
        }
    });

    const handleForceUpdate = () => {
        hasFunctionRunRef.current = false;
        forceUpdate();
    };

    return (
        <ArrowContext.Provider value={{ showArrows, setShowArrows, xRefs, setRef, deleteRef, arrowCoords, updateArrows: handleForceUpdate }}>
            <Xwrapper>
                <StageGlobalContainer_Holder
                    ref={(el) => {
                        stageContainerRef(el);
                    }}
                    className="importantScrollbar"
                >
                    {children}
                    <ArrowHolder>
                        {showArrows &&
                            arrowCoords?.map((coords, index) => (
                                <Xarrow key={index} start={coords.start} end={coords.end} color={coords.color} zIndex={1} startAnchor="top" endAnchor="bottom" curveness={1} path="smooth" />
                            ))}
                    </ArrowHolder>
                </StageGlobalContainer_Holder>
            </Xwrapper>
        </ArrowContext.Provider>
    );
};

export const useArrowContext = (): IArrowState => {
    const context = useContext(ArrowContext);
    if (!context) {
        throw new Error('useArrowContext must be used within a ArrowProvider');
    }
    return context;
};
