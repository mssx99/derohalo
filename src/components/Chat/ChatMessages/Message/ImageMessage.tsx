import React, { useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { ImageDisplayWrapper } from 'components/common/dialogs/ImageDisplayDialog';

interface IImageMessage {
    value: IChatMessage;
}

const Container = styled('div')`
    overflow: hidden;

    & > img {
        max-width: 100%;
        max-height: 100%;
        vertical-align: middle;

        transition: transform 0.3s ease;
        cursor: pointer;

        &:hover {
            transform: scale(1.1);
        }
    }
`;

const ImageMessage: React.FC<IImageMessage> = ({ value: message }) => {
    const dataUrl = useMemo(() => `data:${message.type};base64,${message.content}`, [message.type, message.content]);
    return (
        <ImageDisplayWrapper image={message.content}>
            <Container>
                <img src={dataUrl} alt="image" />
            </Container>
        </ImageDisplayWrapper>
    );
};

export default ImageMessage;
