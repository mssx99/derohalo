import React, { useRef, useLayoutEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import { useArrowContext } from 'contexts/MultiSigArrowContext';
import { useColorize, useContract, useDragStart, useWallets } from 'hooks/multiSigHooks';
import WalletRender from 'components/common/WalletRender';
import { WALLET_BACKGROUND_COLOR } from 'Constants';
import { getApproverDraggableId } from 'helpers/MultiSig/MultiSigSmartContractHelper';

interface IApproverContainerProps {
    value: IApprover;
    index: number;
}

interface IContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    isDragging: boolean;
    walletColor: string | null;
    walletIsHovered: boolean;
    colorize: boolean;
}

const Container = styled('div', { shouldForwardProp: (prop) => !['isDragging', 'walletColor', 'walletIsHovered', 'colorize'].includes(prop as string) })<IContainerProps>(
    ({ theme, isDragging, walletColor, walletIsHovered, colorize }) => ({
        backgroundColor: walletIsHovered || colorize ? `${walletColor}` : WALLET_BACKGROUND_COLOR,
        transition: 'background-color 0.2s ease-out',
        color: 'black',
        padding: 5,
        borderRadius: 5,
        margin: 3,
        border: '1px ' + (isDragging ? 'dashed #000' : 'solid #ddd'),
    })
);

const Header = styled('div')({
    textAlign: 'center',
});

const ApproverContainer: React.FC<IApproverContainerProps> = ({ value, index }: IApproverContainerProps) => {
    const { isLoaded } = useContract();
    const draggableId = getApproverDraggableId(value);
    const { setRef, deleteRef, updateArrows } = useArrowContext();
    const { setWalletHovered } = useWallets();
    const { colorize } = useColorize();
    const { dragStartWalletId } = useDragStart();

    const localRef = useRef<HTMLDivElement | null>(null);

    const onMouseEnter = (): void => {
        setWalletHovered(value.wallet, true);
    };

    const onMouseLeave = (): void => {
        setTimeout(() => setWalletHovered(value.wallet, false), 0);
    };

    useLayoutEffect(() => {
        setRef(draggableId, localRef);

        return () => {
            deleteRef(draggableId);
        };
    }, [draggableId]);

    return (
        <Draggable draggableId={draggableId} index={index} isDragDisabled={isLoaded}>
            {(provided, snapshot) => (
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
                    walletColor={value.wallet?.color}
                    walletIsHovered={value.wallet?.isHovered}
                    colorize={colorize || dragStartWalletId === value.wallet?.id}
                >
                    <Header>
                        <WalletRender value={value.wallet} approverId={value.id} />
                    </Header>
                </Container>
            )}
        </Draggable>
    );
};

export default ApproverContainer;
