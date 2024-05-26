import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import { useArrowContext } from 'contexts/MultiSigArrowContext';
import { useColorize, useDragStart, useWallets } from 'hooks/multiSigHooks';
import { useWalletDialog } from './dialogs/WalletDialog';
import WalletRender from 'components/common/WalletRender';
import { WALLET_BACKGROUND_COLOR } from 'Constants';
import { getInvolvedPartyDraggableId } from 'helpers/MultiSig/MultiSigSmartContractHelper';

interface IInvolvedParty {
    wallet: IWallet;
    index: number;
}

interface IContainer {
    isDragging?: boolean;
    walletColor?: string | null;
    walletIsHovered?: boolean;
    colorize?: boolean;
}

const Container = styled('div', { shouldForwardProp: (prop) => !['isDragging', 'walletColor', 'walletIsHovered', 'colorize'].includes(prop as string) })<IContainer>(
    ({ theme, isDragging, walletColor, walletIsHovered, colorize }) => ({
        color: 'black',
        backgroundColor: walletIsHovered || colorize ? `${walletColor}` : WALLET_BACKGROUND_COLOR,
        transition: 'background-color 0.2s ease-out',
        minWidth: '100px',
        display: 'flex',
        padding: 5,
        borderRadius: 5,
        marginRight: 10,
        border: `1px ${isDragging ? 'dashed #000' : 'solid #ddd'}`,
    })
);

const Clone = styled(Container)(
    () => `
    ~ div {
        transform: none !important;
    }`
);

const Header = styled('div')({ flex: 1 });

const InvolvedParty: React.FC<IInvolvedParty> = ({ wallet, index }) => {
    const draggableId = getInvolvedPartyDraggableId(wallet);

    const { setRef, deleteRef } = useArrowContext();
    const { setWalletHovered } = useWallets();
    const { colorize } = useColorize();
    const { dragStartWalletId } = useDragStart();

    return (
        <Draggable key={wallet.id} draggableId={draggableId} index={index}>
            {(provided, snapshot) => {
                const localRef = useRef<HTMLDivElement | null>(null);
                const cloneRef = useRef<HTMLDivElement | null>(null);

                const onMouseEnter = (): void => {
                    setWalletHovered(wallet, true);
                };

                const onMouseLeave = (): void => {
                    setTimeout(() => setWalletHovered(wallet, false), 0);
                };

                useLayoutEffect(() => {
                    setRef(draggableId, localRef);

                    return () => {
                        deleteRef(draggableId);
                    };
                }, []);

                useLayoutEffect(() => {
                    const cloneId = `clone_${draggableId}`;
                    snapshot.isDragging && setRef(cloneId, cloneRef);

                    return () => {
                        snapshot.isDragging && deleteRef(cloneId);
                    };
                }, [snapshot.isDragging]);

                return (
                    <>
                        <Container
                            ref={(el) => {
                                provided.innerRef(el);
                                localRef.current = el;
                            }}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            walletColor={wallet?.color}
                            walletIsHovered={wallet?.isHovered}
                            colorize={colorize || dragStartWalletId === wallet.id}
                        >
                            <Header>
                                <WalletRender value={wallet} />
                            </Header>
                        </Container>
                        {snapshot.isDragging && (
                            <Clone ref={cloneRef} walletColor={wallet?.color} walletIsHovered={wallet?.isHovered} colorize={colorize || dragStartWalletId === wallet.id}>
                                <WalletRender value={wallet} />
                            </Clone>
                        )}
                    </>
                );
            }}
        </Draggable>
    );
};

export default InvolvedParty;
