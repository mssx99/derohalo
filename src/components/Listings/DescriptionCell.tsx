import React, { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { CachedLoader } from './CachedLoader';
import LinearProgress from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import { ImageDisplayWrapper } from 'components/common/dialogs/ImageDisplayDialog';
import NoMaxWidthTooltip from 'components/common/NoMaxWidthTooltip';

interface IDescriptionCell {
    listing: IListing;
}

function useCellVisibility<T extends Element>(callback: () => void): RefObject<T> {
    const cellRef = useRef<T>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    callback();
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 1.0,
            }
        );

        if (cellRef.current) {
            observer.observe(cellRef.current);
        }

        return () => {
            if (cellRef.current) {
                observer.unobserve(cellRef.current);
            }
        };
    }, [callback]);

    return cellRef;
}

const Container = styled('div')`
    flex-grow: 1;
    display: flex;
    align-items: center;
`;

const DescriptionContainer = styled('div')`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    flex-grow: 1;
`;

const TitleContainer = styled('div')`
    max-width: 40rem;

    & p {
        text-wrap: wrap;
    }
`;

const DescriptionCell: React.FC<IDescriptionCell> = ({ listing }) => {
    const onVisible = useCallback(() => {
        CachedLoader.addListingToQueue(listing);
    }, [listing]);

    const cellVisibilityRef = useCellVisibility<HTMLDivElement>(onVisible);

    let content: React.ReactNode;
    switch (listing.loadingState) {
        case 'LOADING':
        // fall through
        case 'PENDING':
            content = <LinearProgress />;
            break;
        default:
            let description = listing.contract?.description ?? '';
            let image: IGuaranteeImage | null = null;
            if (listing.contract?.images && Object.keys(listing.contract?.images).length > 0) {
                image = listing.contract.images[Object.keys(listing.contract.images)[0]];
            }

            if (!description && !image) {
                description = 'No description or image.';
            } else if (!description && image) {
                description = 'No description.';
            }

            const titleDescription = listing.contract?.description ? (
                <TitleContainer>
                    <p>Description: {description}</p>
                </TitleContainer>
            ) : null;

            const titleImage =
                image && image.description.trim().length > 0 ? (
                    <TitleContainer>
                        <p>Description: {image.description}</p>
                    </TitleContainer>
                ) : null;

            content = (
                <Container>
                    <NoMaxWidthTooltip title={titleDescription} placement="right" followCursor>
                        <DescriptionContainer>{description}</DescriptionContainer>
                    </NoMaxWidthTooltip>
                    {image && (
                        <ImageDisplayWrapper image={image.fullImage} description={image.description}>
                            <NoMaxWidthTooltip title={titleImage} placement="right" followCursor>
                                <img src={`data:;base64,${image.thumb}`} alt={image.description} />
                            </NoMaxWidthTooltip>
                        </ImageDisplayWrapper>
                    )}
                </Container>
            );
    }

    return (
        <div style={{ flexGrow: 1 }} ref={cellVisibilityRef}>
            {content}
        </div>
    );
};

export default DescriptionCell;
