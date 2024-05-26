import { getArrowStartEndMultiSig } from 'helpers/ArrowHelper';
import { styled } from '@mui/material/styles';
import React, { createContext, useContext, useReducer, useState, useRef, useEffect, useCallback, ReactElement } from 'react';
import Xarrow, { Xwrapper, useXarrow } from 'react-xarrows';
import { useContract } from 'hooks/multiSigHooks';
import { useForceUpdate } from 'hooks/mainHooks';

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

const ArrowHolder = styled('div')({
    position: 'absolute',
    top: 0,
});

const ArrowContext = createContext<IArrowState | undefined>(undefined);
const xRefs = new Map<string, React.RefObject<HTMLDivElement>>();

export const ArrowProvider: React.FC<IArrowProvider> = ({ children }) => {
    const [arrowCoords, setArrowCoords] = useState<IArrowCoords[]>(new Array<IArrowCoords>());
    const updateXarrow = useXarrow();
    const { contract } = useContract();
    const [showArrows, setShowArrows] = useState<boolean>(false);

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
        const arrowCoords = contract.authorizationGroups.reduce((accAuthGroups, ag) => {
            const newArrows = ag.approvers.reduce((accApprovers, approver) => {
                const coords = getArrowStartEndMultiSig(contract, approver, xRefs);
                if (coords) accApprovers.push(coords);

                return accApprovers;
            }, new Array<IArrowCoords>());
            accAuthGroups.push(...newArrows);
            return accAuthGroups;
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
                {children}
                <ArrowHolder>
                    {showArrows &&
                        arrowCoords?.map((coords, index) => (
                            <Xarrow key={index} start={coords.start} end={coords.end} color={coords.color} zIndex={1} startAnchor="bottom" endAnchor="top" curveness={1} path="smooth" />
                        ))}
                </ArrowHolder>
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
