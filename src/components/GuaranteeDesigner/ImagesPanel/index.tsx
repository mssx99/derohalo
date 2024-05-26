import React from 'react';
import { useContract, useIsGuaranteeOwner } from 'hooks/guaranteeHooks';
import { styled } from '@mui/material/styles';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import IconButton from '@mui/material/IconButton';
import { useAddImageDialog } from '../dialogs/AddImageDialog';
import { ImageDisplayWrapper } from 'components/common/dialogs/ImageDisplayDialog';
import { setBusyBackdrop } from 'hooks/mainHooks';
import { loadContractAndSet, removeImage } from 'helpers/Guarantee/GuaranteeSmartContractHelper';
import { updateWalletBalance } from 'hooks/deroHooks';
import { addSnackbar } from 'components/screen/Snackbars';
import { MESSAGE_SEVERITY } from 'Constants';

const StyledIconButton = styled(IconButton)`
    /* position: absolute;
    top: 5px;
    right: 5px; */
`;

const Container = styled('div')`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
`;

const InnerContainer = styled('div')`
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: row-reverse;
    height: 100%;
`;

const ImageContainer = styled('div')`
    display: flex;
    justify-content: flex-end;
    gap: 2px;
    background-color: black;
    height: 100%;
`;

const ImageHolder = styled('div')`
    overflow: hidden;
    height: 100%;

    & img {
        object-fit: cover;
        height: 100%;
        transition: transform 0.3s ease;
        cursor: pointer;

        &:hover {
            transform: scale(1.2);
        }
    }
`;

const ImagesPanel: React.FC = () => {
    const { setOpen } = useAddImageDialog();
    const { isNew, contract } = useContract();
    const isGuaranteeOwner = useIsGuaranteeOwner();

    const isEditable = !isNew && !contract.firstPartyAmountFunded && !contract.secondPartyAmountFunded && isGuaranteeOwner;

    const handleAddImageClick = () => {
        console.log('add image clicked');
        setOpen(true);
    };

    return (
        <Container>
            <InnerContainer>
                {isEditable && (
                    <StyledIconButton onClick={handleAddImageClick} aria-label="add image">
                        <AddPhotoAlternateIcon />
                    </StyledIconButton>
                )}
                <ImageContainer>
                    {Object.keys(contract.images).map((key) => {
                        const image = contract.images[key];
                        return <Image key={key} scid={contract.scid!} value={image} removable={isEditable} />;
                    })}
                </ImageContainer>
            </InnerContainer>
        </Container>
    );
};

interface IImage {
    scid: string;
    value: IGuaranteeImage;
    removable: boolean;
}

const Image: React.FC<IImage> = ({ scid, value, removable }) => {
    let removeFunction: (() => void) | undefined;
    if (removable) {
        removeFunction = async () => {
            console.log('Removing', value);
            setBusyBackdrop(true, 'Removing the image from the GuaranteeContract...');
            try {
                const txid = await removeImage(scid, value.id);
                updateWalletBalance();
                loadContractAndSet(scid, false);
                addSnackbar({ message: 'Successfully removed.', severity: MESSAGE_SEVERITY.SUCCESS });
            } catch (e) {
                console.error(e);
                addSnackbar({ message: 'An error occurred.', severity: MESSAGE_SEVERITY.ERROR });
            } finally {
                setBusyBackdrop(false);
            }
        };
    }

    return (
        <ImageDisplayWrapper image={value.fullImage} description={value.description} removeFunction={removeFunction}>
            <ImageHolder>
                <img src={`data:;base64,${value.thumb}`} alt={value.description} />
            </ImageHolder>
        </ImageDisplayWrapper>
    );
};

export default ImagesPanel;
