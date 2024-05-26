import React, { useEffect, useState, useRef, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { create } from 'zustand';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import { setBusyBackdrop } from 'hooks/mainHooks';

const TRANSITION_TIME = 1000;

const Container = styled('div')`
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2000;

    transition: background-color ${TRANSITION_TIME}ms ease;
    background-color: transparent;

    pointer-events: none;

    &.opaque {
        background-color: #000000e1;
        pointer-events: all;
    }

    & img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    & div {
        position: fixed;
        left: 0.5rem;
        right: 0.5rem;
        bottom: 0.5rem;

        transition: opacity ${TRANSITION_TIME}ms ease;
        opacity: 0;

        &.opaque {
            opacity: 1;
        }
    }
`;

type StoreState = {
    isOpen: boolean;
    setOpen: (newOpen: boolean) => void;
    image: string | null;
    sourceRef: HTMLDivElement | null;
    description?: string | null;
    removeFunction?: () => void;
    setImage: (image: string | null, sourceRef: HTMLDivElement | null, description?: string | null, removeFunction?: () => void, isOpen?: boolean) => void;
};

const useStore = create<StoreState>((set) => ({
    isOpen: false,
    setOpen: (isOpen: boolean) => set({ isOpen }),
    image: null,
    sourceRef: null,
    description: null,
    removeFunction: () => {},
    setImage: (image: string | null, sourceRef: HTMLDivElement | null, description?: string | null, removeFunction?: () => void, isOpen: boolean = true) =>
        set({ image, sourceRef, description, removeFunction, isOpen }),
}));

export const useImageDisplayDialog: () => {
    isOpen: boolean;
    setOpen: (newIsOpen: boolean) => void;
    image: string | null;
    sourceRef: HTMLDivElement | null;
    description?: string | null;
    removeFunction?: () => void;
    setImage: (image: string | null, sourceRef: HTMLDivElement | null, description?: string | null, removeFunction?: () => void, isOpen?: boolean) => void;
} = () => {
    const isOpen = useStore((state) => state.isOpen);
    const setOpen = useStore((state) => state.setOpen);
    const image = useStore((state) => state.image);
    const sourceRef = useStore((state) => state.sourceRef);
    const description = useStore((state) => state.description);
    const removeFunction = useStore((state) => state.removeFunction);
    const setImage = useStore((state) => state.setImage);

    return { isOpen, setOpen, image, sourceRef, description, removeFunction, setImage };
};

const RemoveButton = styled(Button)`
    background-color: red;
    color: white;
    margin-right: 0.5rem;
    &:hover {
        background-color: darkred;
    }
`;

const ImageDisplayDialog: React.FC = () => {
    const { isOpen, setOpen, image: base64, sourceRef, description, removeFunction } = useImageDisplayDialog();

    const [opaque, setOpaque] = useState(false);
    const [isShowing, setIsShowing] = useState(false);
    const [transform, setTransform] = useState('');
    const animationRef = useRef<HTMLElement>(null);

    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setImage(null);
        const image = new Image();
        image.onload = () => {
            if (sourceRef && image) {
                const rect = sourceRef.getBoundingClientRect();

                const aspectRatio_Window = window.innerWidth / window.innerHeight;
                const aspectRatio_Image = image.naturalWidth / image.naturalHeight;

                let scaleX = rect.width / window.innerWidth;
                let scaleY = rect.height / window.innerHeight;

                if (aspectRatio_Image > aspectRatio_Window) {
                    scaleY = (scaleY * aspectRatio_Image) / aspectRatio_Window;
                } else {
                    scaleX = (scaleX * aspectRatio_Window) / aspectRatio_Image;
                }

                const offsetX = rect.x - window.innerWidth / 2 + rect.width / 2;
                const offsetY = rect.y - window.innerHeight / 2 + rect.height / 2;

                const transform = `translate(${offsetX}px, ${offsetY}px) scaleX(${scaleX}) scaleY(${scaleY})`;
                setTransform(transform);
            }
        };

        image.src = `data:;base64,${base64}`;
        setImage(image);
    }, [base64, sourceRef, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setIsShowing(true);

            setTimeout(() => {
                setOpaque(true);
            }, 50);
        }
    }, [isOpen]);

    const handleCloseClick = () => {
        if (animationRef.current) {
            animationRef.current.style.animationPlayState = 'paused';
        }

        setTimeout(() => {
            if (animationRef.current) {
                animationRef.current.style.animation = `fadeInScaleReverse ${TRANSITION_TIME / 2}ms ease-in-out forwards`;
            }
            setOpaque(false);
        }, 50);

        setTimeout(() => {
            setIsShowing(false);
            setOpen(false);
            setTransform('');
        }, TRANSITION_TIME);
    };

    const handleRemoveClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (removeFunction) removeFunction();
            handleCloseClick();
        },
        [removeFunction, handleCloseClick]
    );

    if (!isShowing || !image || !transform) return <></>;

    return (
        <Container className={opaque ? 'opaque' : ''} onClick={handleCloseClick}>
            <Box
                ref={animationRef}
                component="img"
                sx={{
                    '--transformPic': transform,
                    animation: `fadeInScale ${TRANSITION_TIME / 2}ms ease-in-out ${opaque ? 'forwards' : ''}`,
                    transform: transform,
                    '@keyframes fadeInScale': {
                        '0%': {
                            opacity: 0,
                            transform: 'var(--transformPic)',
                        },
                        '10%': {
                            opacity: 1,
                        },
                        '100%': {
                            transform: 'none',
                        },
                    },
                    '@keyframes fadeInScaleReverse': {
                        '0%': {
                            transform: 'none',
                        },
                        '90%': {
                            opacity: 1,
                        },
                        '100%': {
                            opacity: 0,
                            transform: 'var(--transformPic)',
                        },
                    },
                }}
                src={image.src}
                alt={description ?? ''}
            />

            <div className={'blackTextShadow' + (opaque ? ' opaque' : '')}>
                {' '}
                {removeFunction && (
                    <RemoveButton variant="contained" startIcon={<DeleteIcon />} onClick={handleRemoveClick}>
                        Remove
                    </RemoveButton>
                )}
                <span>{description}</span>
            </div>
        </Container>
    );
};

interface IImageDisplayWrapper {
    image: string;
    description?: string;
    removeFunction?: () => void;
    children: React.ReactNode;
}

const WrapperContainer = styled('div')`
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const ImageDisplayWrapper: React.FC<IImageDisplayWrapper> = ({ image, description, removeFunction, children }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const { setImage } = useImageDisplayDialog();

    const handleOpenClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();
            setImage(image, ref.current, description, removeFunction);
        },
        [image, description, removeFunction, setImage]
    );

    return (
        <>
            <WrapperContainer ref={ref} onClick={handleOpenClick}>
                {children}
            </WrapperContainer>
        </>
    );
};

export default ImageDisplayDialog;
