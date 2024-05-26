import React, { useState, useEffect } from 'react';

import { styled } from '@mui/material/styles';
import { formatNumber } from 'helpers/FormatHelper';
import DeroAmount from 'components/common/DeroAmount';
import { getEstimatedTransferCost, getEstimatedTransfers } from 'helpers/ChatHelper';
import { fileOrBlobToBase64 } from 'helpers/Helper';

interface IPreview {
    imageFile?: File;
    compressedFile?: File;
    base64bytes: number;
}

const Container = styled('div')`
    margin-top: 20px;
    display: flex;
    flex-direction: row;
    gap: 10px;

    & img {
        flex-basis: 200px;
        object-fit: contain;
        border-radius: 5px;
        max-height: 180px;
    }

    & div {
        display: flex;
        width: 50%;
        flex-direction: column;
    }
`;

const Preview: React.FC<IPreview> = ({ imageFile, compressedFile, base64bytes }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [compressedUrl, setCompressedUrl] = useState<string>('');

    useEffect(() => {
        if (!imageFile) {
            setImageUrl('');
            setCompressedUrl('');
            return;
        }
        const imageUrl = URL.createObjectURL(imageFile);
        setImageUrl(imageUrl);
        return () => {
            URL.revokeObjectURL(imageUrl);
        };
    }, [imageFile]);

    useEffect(() => {
        if (!compressedFile) {
            setCompressedUrl('');
            return;
        }
        const compressedUrl = URL.createObjectURL(compressedFile);
        setCompressedUrl(compressedUrl);
        return () => {
            URL.revokeObjectURL(compressedUrl);
        };
    }, [compressedFile]);

    return (
        <Container>
            {imageUrl && imageFile && (
                <div>
                    <img src={imageUrl} alt="Source" />
                    <span>
                        {formatNumber(imageFile.size)} bytes ({imageFile.type})
                    </span>
                </div>
            )}
            {compressedUrl && compressedFile && (
                <div>
                    <img src={compressedUrl} alt="Compressed" />
                    <span>
                        {formatNumber(compressedFile.size)} bytes ({compressedFile.type})
                    </span>
                    {base64bytes > 0 && (
                        <span>
                            Cost <DeroAmount value={getEstimatedTransferCost(getEstimatedTransfers(base64bytes))} />
                        </span>
                    )}
                </div>
            )}
        </Container>
    );
};

export default Preview;
