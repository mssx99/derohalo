import React from 'react';
import { styled } from '@mui/material/styles';
import NoMaxWidthTooltip from 'components/common/NoMaxWidthTooltip';

interface IMarketScid {
    listing: IListing;
}

const Container = styled('div')`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

const MarketContainer = styled('div')`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
`;

const ScidContainer = styled(MarketContainer)`
    direction: rtl;
    font-size: 0.725rem;
`;

const TitleContainer = styled('div')`
    display: flex;
    flex-direction: column;
    max-width: 34rem;

    & p:nth-of-type(1) {
        text-wrap: wrap;
    }
`;

const MarketScid: React.FC<IMarketScid> = ({ listing }) => {
    const market = listing.market.trim().length > 0 ? listing.market : '<Unknown>';

    const title = (
        <TitleContainer>
            <p>Market: {market}</p>
            <p>Scid: {listing.scid}</p>
        </TitleContainer>
    );

    return (
        <NoMaxWidthTooltip title={title} placement="right" followCursor>
            <Container>
                <MarketContainer>{market}</MarketContainer>
                <ScidContainer>{listing.scid}</ScidContainer>
            </Container>
        </NoMaxWidthTooltip>
    );
};

export default MarketScid;
