import React, { useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { useCurrentBlockheightOrEstimate } from 'hooks/deroHooks';
import NumberTextFieldUpDown from 'components/common/NumberTextFieldUpDown';
import { useCurrentGuaranteeContractListing, useContract as useWebContract } from 'hooks/webHooks';
import Slider from '@mui/material/Slider';
import { Body } from 'components/common/TextElements';
import { convertBlocksToFormattedTime } from 'helpers/FormatHelper';

interface IPurchaseSlider {
    value: number;
    onChange: (value: number) => void;
}

const Container = styled('div')`
    display: flex;
    gap: 1rem;
`;

const VertContainer = styled('div')`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    text-align: center;
`;

const PurchaseSlider: React.FC<IPurchaseSlider> = ({ value: purchasedPackages, onChange }) => {
    const { blockheight, estimate } = useCurrentBlockheightOrEstimate();
    const webContract = useWebContract();
    const existingListing = useCurrentGuaranteeContractListing();

    const publishedUntil = useMemo(() => {
        if (!webContract) return 0;

        const paidUntilBlock = existingListing?.paidUntilBlock ?? 0;

        let newBlockheight = paidUntilBlock > blockheight ? paidUntilBlock : blockheight;
        newBlockheight += purchasedPackages * webContract.guaranteeBlockPackageSize;

        return convertBlocksToFormattedTime(newBlockheight - blockheight);
    }, [existingListing?.paidUntilBlock, blockheight, estimate, webContract, purchasedPackages]);

    const handleTextFieldChange = (value: number) => {
        onChange(value);
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        const value = newValue as number;
        onChange(value);
    };

    return (
        <Container>
            <NumberTextFieldUpDown label="Packages" min={0} max={100} value={purchasedPackages} onChange={handleTextFieldChange} />
            <VertContainer>
                <Slider value={purchasedPackages} aria-label="Number of purchased packages." valueLabelDisplay="auto" onChange={handleSliderChange} step={1} min={0} max={100} />
                <Body>Published until {publishedUntil}</Body>
            </VertContainer>
        </Container>
    );
};

export default PurchaseSlider;
